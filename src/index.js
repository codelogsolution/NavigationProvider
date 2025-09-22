/* src/index.js */
import React from 'react';
import {
  NavigationContainer,
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/* navigation ref so helpers can act from anywhere */
const navigationRef = createNavigationContainerRef();

/* map of name -> path (path is array of navigator/screen names to reach it) */
let screenPathMap = {};

/* ---------- Build map: map every node name (navigator or screen) to its path ---------- */
const buildScreenPathMap = (config) => {
  screenPathMap = {};

  const walk = (node, parentPath = []) => {
    if (!node) return;
    const currentPath = node.name ? parentPath.concat(node.name) : parentPath;

    // Map this node name to its current path (navigator nodes included)
    if (node.name) {
      // keep first occurrence if duplicates exist
      if (!screenPathMap[node.name]) {
        screenPathMap[node.name] = currentPath.slice();
      } else {
        // optionally you could log duplicates
        // console.warn(`Duplicate screen/navigator name "${node.name}" - using first occurrence.`);
      }
    }

    // Walk children if any
    if (Array.isArray(node.screens) && node.screens.length) {
      node.screens.forEach((child) => walk(child, currentPath));
    }
  };

  walk(config, []);
};

/* ---------- Helpers to build nested params / reset routes ---------- */
const buildNestedParams = (subPath, finalParams) => {
  // subPath e.g. ['HomeStack','Home']
  if (!subPath || subPath.length === 0) return undefined;
  const [first, ...rest] = subPath;
  if (rest.length === 0) {
    return { screen: first, params: finalParams };
  }
  return { screen: first, params: buildNestedParams(rest, finalParams) };
};

const buildResetRoutesFromPath = (path, finalParams) => {
  // path example: ['MainTab','HomeStack','Home']
  if (!path || path.length === 0) return [];

  const [root, ...rest] = path;
  if (rest.length === 0) {
    const r = { name: root };
    if (finalParams) r.params = finalParams;
    return [r];
  }

  // recursive builder for nested state
  const stateFor = (sub) => {
    // sub is like ['HomeStack','Home']
    if (!sub || sub.length === 0) return undefined;
    if (sub.length === 1) {
      const rr = { name: sub[0] };
      if (sub[0] === path[path.length - 1] && finalParams) rr.params = finalParams;
      return { routes: [rr] };
    }
    const [cur, ...restSub] = sub;
    const innerState = stateFor(restSub);
    return { routes: [{ name: cur, state: innerState }] };
  };

  const rootRoute = { name: root, state: stateFor(rest) };
  return [rootRoute];
};

/* ---------- navigator renderers (recursive) ---------- */
const wrapNavigator = (renderFn) => () => <>{renderFn()}</>;

const renderStack = (config) => {
  if (!config) return null;

  if (config.type === 'stack') {
    return (
      <Stack.Navigator initialRouteName={config.initialRouteName} screenOptions={config.screenOptions || {}}>
        {(config.screens || []).map((screen, i) => {
          if (screen.type === 'stack' || screen.type === 'tab') {
            return (
              <Stack.Screen
                key={screen.name || `stack${i}`}
                name={screen.name || `stack${i}`}
                component={wrapNavigator(() => renderStack(screen))}
                options={screen.options || {}}
              />
            );
          }
          return (
            <Stack.Screen
              key={screen.name || `screen${i}`}
              name={screen.name || `screen${i}`}
              component={screen.component || View}
              options={screen.options || {}}
            />
          );
        })}
      </Stack.Navigator>
    );
  }

  if (config.type === 'tab') {
    return (
      <Tab.Navigator initialRouteName={config.initialRouteName} screenOptions={config.screenOptions || {}}>
        {(config.screens || []).map((screen, i) => {
          if (screen.type === 'stack' || screen.type === 'tab') {
            return (
              <Tab.Screen
                key={screen.name || `tab${i}`}
                name={screen.name || `tab${i}`}
                component={wrapNavigator(() => renderStack(screen))}
                options={screen.options || {}}
              />
            );
          }
          return (
            <Tab.Screen
              key={screen.name || `screen${i}`}
              name={screen.name || `screen${i}`}
              component={screen.component || View}
              options={screen.options || {}}
            />
          );
        })}
      </Tab.Navigator>
    );
  }

  // leaf component
  if (config.component) {
    const Comp = config.component;
    return <Comp />;
  }

  return null;
};

/* ---------- NavigationProvider component (build map & render) ---------- */
export const NavigationProvider = ({ config }) => {
  // Build the map each render (cheap). If needed, memoize on config.
  buildScreenPathMap(config);
  return <NavigationContainer ref={navigationRef}>{renderStack(config)}</NavigationContainer>;
};

export default NavigationProvider;

/* ---------- exported helpers ---------- */
function isReady() {
  return navigationRef && navigationRef.isReady && navigationRef.isReady();
}

/**
 * navigateTo: navigate to any named navigator or leaf screen registered in config.
 * - If the name refers to a navigator (e.g. 'HomeStack'), this will navigate to its parent (root) and activate it.
 * - If the name refers to a leaf screen (e.g. 'Home'), it will navigate to its root with nested params.
 */
function navigateTo(name, params) {
  const path = screenPathMap[name];
  if (!path) {
    console.warn(`[NavigationProvider] navigateTo: no path found for "${name}"`);
    return;
  }
  if (!isReady()) return;

  // if root-level
  if (path.length === 1) {
    navigationRef.navigate(path[0], params);
    return;
  }

  // navigate to root and pass nested params
  const nested = buildNestedParams(path.slice(1), params);
  navigationRef.navigate(path[0], nested);
}

/**
 * navigateToStack: convenience alias to navigate to the stack navigator itself (doesn't open a specific leaf)
 * e.g. navigateToStack('HomeStack') -> goes to MainTab -> HomeStack
 */
function navigateToStack(stackName) {
  return navigateTo(stackName, undefined);
}

/**
 * navigateNested: call navigationRef.navigate(rootName, nested) directly
 */
function navigateNested(rootName, nested) {
  if (!isReady()) return;
  navigationRef.navigate(rootName, nested);
}

/**
 * resetToScreen: reset whole nav state to reach this named screen (clear history).
 * This emulates "cross-navigator replace".
 */
function resetToScreen(name, params) {
  const path = screenPathMap[name];
  if (!path) {
    console.warn(`[NavigationProvider] resetToScreen: no path found for "${name}"`);
    return;
  }
  if (!isReady()) return;
  const routes = buildResetRoutesFromPath(path, params);
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes,
    })
  );
}

/**
 * replaceInCurrent: replace current route in focused navigator (like CommonActions.replace)
 */
function replaceInCurrent(name, params) {
  if (!isReady()) return;
  navigationRef.dispatch(CommonActions.replace(name, params));
}

/* exports */
export { navigationRef, navigateTo, navigateToStack, navigateNested, resetToScreen, replaceInCurrent };
