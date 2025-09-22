// src/index.js
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

// --------------------
// Navigation Ref (for helpers)
// --------------------
const navigationRef = createNavigationContainerRef();

// --------------------
// Screen Path Map
// --------------------
let screenPathMap = {};

/**
 * Recursively build a map: screen or navigator name -> path array
 */
const buildScreenPathMap = (config) => {
  screenPathMap = {};

  const walk = (node, parentPath = []) => {
    if (!node) return;
    const currentPath = node.name ? [...parentPath, node.name] : parentPath;

    if (node.name && !screenPathMap[node.name]) {
      screenPathMap[node.name] = currentPath;
    }

    if (Array.isArray(node.screens)) {
      node.screens.forEach((child) => walk(child, currentPath));
    }
  };

  walk(config, []);
};

// --------------------
// Helper: wrap nested navigator
// --------------------
const wrapNavigator = (renderFn) => () => <>{renderFn()}</>;

// --------------------
// Render Stack / Tab recursively
// --------------------
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

  // leaf screen
  if (config.component) {
    const Comp = config.component;
    return <Comp />;
  }

  return null;
};

// --------------------
// NavigationProvider Component
// --------------------
export const NavigationProvider = ({ config }) => {
  buildScreenPathMap(config);
  return <NavigationContainer ref={navigationRef}>{renderStack(config)}</NavigationContainer>;
};

export default NavigationProvider;

// --------------------
// Navigation Helpers
// --------------------
function isReady() {
  return navigationRef && navigationRef.isReady && navigationRef.isReady();
}

/**
 * Navigate to any screen or navigator by name.
 * Example: navigateTo('Home') or navigateTo('HomeStack')
 */
export const navigateTo = (name, params) => {
  const path = screenPathMap[name];
  if (!path) {
    console.warn(`[NavigationProvider] navigateTo: "${name}" not found`);
    return;
  }
  if (!isReady()) return;

  if (path.length === 1) {
    navigationRef.navigate(path[0], params);
    return;
  }

  const buildNested = (subPath, finalParams) => {
    if (!subPath || subPath.length === 0) return undefined;
    const [first, ...rest] = subPath;
    if (rest.length === 0) return { screen: first, params: finalParams };
    return { screen: first, params: buildNested(rest, finalParams) };
  };

  navigationRef.navigate(path[0], buildNested(path.slice(1), params));
};

/**
 * Navigate to a stack navigator itself (e.g. HomeStack)
 */
export const navigateToStack = (stackName) => {
  navigateTo(stackName);
};

/**
 * Reset navigation state to a screen (cross-stack replace)
 */
export const resetToScreen = (name, params) => {
  const path = screenPathMap[name];
  if (!path) {
    console.warn(`[NavigationProvider] resetToScreen: "${name}" not found`);
    return;
  }
  if (!isReady()) return;

  const buildReset = (pathArr, finalParams) => {
    if (!pathArr || pathArr.length === 0) return [];
    const [root, ...rest] = pathArr;
    if (rest.length === 0) {
      const r = { name: root };
      if (finalParams) r.params = finalParams;
      return [r];
    }

    const stateFor = (sub) => {
      if (!sub || sub.length === 0) return undefined;
      if (sub.length === 1) {
        const rr = { name: sub[0] };
        if (sub[0] === pathArr[pathArr.length - 1] && finalParams) rr.params = finalParams;
        return { routes: [rr] };
      }
      const [cur, ...restSub] = sub;
      return { routes: [{ name: cur, state: stateFor(restSub) }] };
    };

    return [{ name: root, state: stateFor(rest) }];
  };

  const routes = buildReset(path, params);
  navigationRef.dispatch(CommonActions.reset({ index: 0, routes }));
};

/**
 * Replace in current navigator (normal React Navigation replace)
 */
export const replaceInCurrent = (name, params) => {
  if (!isReady()) return;
  navigationRef.dispatch(CommonActions.replace(name, params));
};

export { navigationRef };
