/* src/index.js (upgraded) */
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

/* queue for calls made before navigation is ready */
const pendingActions = [];
const enqueueOrRun = (fn) => {
  if (navigationRef.isReady && navigationRef.isReady()) {
    fn();
  } else {
    pendingActions.push(fn);
  }
};
const flushPending = () => {
  while (pendingActions.length) {
    const fn = pendingActions.shift();
    try {
      fn();
    } catch (e) {
      // swallow but log — avoid crashing app init
      // eslint-disable-next-line no-console
      console.warn('[NavigationProvider] pending action error', e);
    }
  }
};

/* ---------- Build map: map every node name -> first path (or array if duplicates) ---------- */
const buildScreenPathMap = (config) => {
  const map = {}; // name -> path array OR name -> [path1, path2, ...]
  const walk = (node, parentPath = []) => {
    if (!node) return;
    const currentPath = node.name ? parentPath.concat(node.name) : parentPath;

    if (node.name) {
      if (!map[node.name]) {
        map[node.name] = currentPath.slice();
      } else {
        // If duplicate, convert to array of paths (preserve first by default)
        if (!Array.isArray(map[node.name])) {
          map[node.name] = [map[node.name], currentPath.slice()];
        } else {
          map[node.name].push(currentPath.slice());
        }
        // eslint-disable-next-line no-console
        console.warn(`[NavigationProvider] Duplicate name "${node.name}" registered; using first occurrence by default.`);
      }
    }

    if (Array.isArray(node.screens) && node.screens.length) {
      node.screens.forEach((child) => walk(child, currentPath));
    }
  };

  walk(config, []);
  return map;
};

/* ---------- Helpers to build nested params / reset routes ---------- */
const buildNestedParams = (subPath, finalParams) => {
  if (!subPath || subPath.length === 0) return undefined;
  const [first, ...rest] = subPath;
  if (rest.length === 0) {
    return { screen: first, params: finalParams };
  }
  return { screen: first, params: buildNestedParams(rest, finalParams) };
};

const buildResetRoutesFromPath = (path, finalParams) => {
  if (!path || path.length === 0) return [];

  const [root, ...rest] = path;
  if (rest.length === 0) {
    const r = { name: root };
    if (finalParams) r.params = finalParams;
    return [r];
  }

  const stateFor = (sub) => {
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

/* ---------- navigator renderers (unchanged, but safe) ---------- */
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

  if (config.component) {
    const Comp = config.component;
    return <Comp />;
  }

  return null;
};

/* ---------- NavigationProvider component (memoize map & flush queue) ---------- */
export const NavigationProvider = ({ config }) => {
  // memoize map for performance; JSON.stringify is OK for moderate config sizes
  const screenPathMap = React.useMemo(() => buildScreenPathMap(config), [JSON.stringify(config)]);

  // expose the map to the module-scoped variable used by helpers
  React.useEffect(() => {
    // replace module-level map reference
    moduleScreenMap.set(screenPathMap);
  }, [screenPathMap]);

  // when navigation becomes ready, flush queued actions
  const onReady = () => {
    flushPending();
  };

  return (
    <NavigationContainer ref={navigationRef} onReady={onReady}>
      {renderStack(config)}
    </NavigationContainer>
  );
};

export default NavigationProvider;

/* ---------- module-level holder for current map (so helpers can access latest) ---------- */
const moduleScreenMap = (() => {
  let current = {};
  return {
    set: (m) => {
      current = m || {};
    },
    get: () => current,
  };
})();

/* ---------- exported helpers using the moduleScreenMap ---------- */
function isReady() {
  return navigationRef && navigationRef.isReady && navigationRef.isReady();
}

function _getPathForName(name) {
  const map = moduleScreenMap.get();
  const entry = map[name];
  if (!entry) return null;
  // if duplicates stored as array return first by default; you can expose API to pick one
  return Array.isArray(entry) ? entry[0] : entry;
}

function navigateTo(name, params) {
  const path = _getPathForName(name);
  if (!path) {
    // eslint-disable-next-line no-console
    console.warn(`[NavigationProvider] navigateTo: no path found for "${name}"`);
    return;
  }
  enqueueOrRun(() => {
    if (path.length === 1) {
      navigationRef.navigate(path[0], params);
      return;
    }
    const nested = buildNestedParams(path.slice(1), params);
    navigationRef.navigate(path[0], nested);
  });
}

function navigateToStack(stackName) {
  return navigateTo(stackName, undefined);
}

function navigateNested(rootName, nested) {
  enqueueOrRun(() => {
    navigationRef.navigate(rootName, nested);
  });
}

function resetToScreen(name, params) {
  const path = _getPathForName(name);
  if (!path) {
    // eslint-disable-next-line no-console
    console.warn(`[NavigationProvider] resetToScreen: no path found for "${name}"`);
    return;
  }
  enqueueOrRun(() => {
    const routes = buildResetRoutesFromPath(path, params);
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes,
      })
    );
  });
}

function replaceInCurrent(name, params) {
  enqueueOrRun(() => {
    navigationRef.dispatch(CommonActions.replace(name, params));
  });
}

/* exports */
export { navigationRef, navigateTo, navigateToStack, navigateNested, resetToScreen, replaceInCurrent };
