"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.NavigationProvider = void 0;
exports.navigateNested = navigateNested;
exports.navigateTo = navigateTo;
exports.navigateToStack = navigateToStack;
exports.navigationRef = void 0;
exports.replaceInCurrent = replaceInCurrent;
exports.resetToScreen = resetToScreen;
var _react = _interopRequireDefault(require("react"));
var _native = require("@react-navigation/native");
var _stack = require("@react-navigation/stack");
var _bottomTabs = require("@react-navigation/bottom-tabs");
var _reactNative = require("react-native");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _toArray(r) { return _arrayWithHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; } /* src/index.js (upgraded) */
var Stack = (0, _stack.createStackNavigator)();
var Tab = (0, _bottomTabs.createBottomTabNavigator)();

/* navigation ref so helpers can act from anywhere */
var navigationRef = exports.navigationRef = (0, _native.createNavigationContainerRef)();

/* queue for calls made before navigation is ready */
var pendingActions = [];
var enqueueOrRun = function enqueueOrRun(fn) {
  if (navigationRef.isReady && navigationRef.isReady()) {
    fn();
  } else {
    pendingActions.push(fn);
  }
};
var flushPending = function flushPending() {
  while (pendingActions.length) {
    var fn = pendingActions.shift();
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
var buildScreenPathMap = function buildScreenPathMap(config) {
  var map = {}; // name -> path array OR name -> [path1, path2, ...]
  var _walk = function walk(node) {
    var parentPath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    if (!node) return;
    var currentPath = node.name ? parentPath.concat(node.name) : parentPath;
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
        console.warn("[NavigationProvider] Duplicate name \"".concat(node.name, "\" registered; using first occurrence by default."));
      }
    }
    if (Array.isArray(node.screens) && node.screens.length) {
      node.screens.forEach(function (child) {
        return _walk(child, currentPath);
      });
    }
  };
  _walk(config, []);
  return map;
};

/* ---------- Helpers to build nested params / reset routes ---------- */
var _buildNestedParams = function buildNestedParams(subPath, finalParams) {
  if (!subPath || subPath.length === 0) return undefined;
  var _subPath = _toArray(subPath),
    first = _subPath[0],
    rest = _subPath.slice(1);
  if (rest.length === 0) {
    return {
      screen: first,
      params: finalParams
    };
  }
  return {
    screen: first,
    params: _buildNestedParams(rest, finalParams)
  };
};
var buildResetRoutesFromPath = function buildResetRoutesFromPath(path, finalParams) {
  if (!path || path.length === 0) return [];
  var _path = _toArray(path),
    root = _path[0],
    rest = _path.slice(1);
  if (rest.length === 0) {
    var r = {
      name: root
    };
    if (finalParams) r.params = finalParams;
    return [r];
  }
  var _stateFor = function stateFor(sub) {
    if (!sub || sub.length === 0) return undefined;
    if (sub.length === 1) {
      var rr = {
        name: sub[0]
      };
      if (sub[0] === path[path.length - 1] && finalParams) rr.params = finalParams;
      return {
        routes: [rr]
      };
    }
    var _sub = _toArray(sub),
      cur = _sub[0],
      restSub = _sub.slice(1);
    var innerState = _stateFor(restSub);
    return {
      routes: [{
        name: cur,
        state: innerState
      }]
    };
  };
  var rootRoute = {
    name: root,
    state: _stateFor(rest)
  };
  return [rootRoute];
};

/* ---------- navigator renderers (unchanged, but safe) ---------- */
var wrapNavigator = function wrapNavigator(renderFn) {
  return function () {
    return /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, renderFn());
  };
};
var _renderStack = function renderStack(config) {
  if (!config) return null;
  if (config.type === 'stack') {
    return /*#__PURE__*/_react["default"].createElement(Stack.Navigator, {
      initialRouteName: config.initialRouteName,
      screenOptions: config.screenOptions || {}
    }, (config.screens || []).map(function (screen, i) {
      if (screen.type === 'stack' || screen.type === 'tab') {
        return /*#__PURE__*/_react["default"].createElement(Stack.Screen, {
          key: screen.name || "stack".concat(i),
          name: screen.name || "stack".concat(i),
          component: wrapNavigator(function () {
            return _renderStack(screen);
          }),
          options: screen.options || {}
        });
      }
      return /*#__PURE__*/_react["default"].createElement(Stack.Screen, {
        key: screen.name || "screen".concat(i),
        name: screen.name || "screen".concat(i),
        component: screen.component || _reactNative.View,
        options: screen.options || {}
      });
    }));
  }
  if (config.type === 'tab') {
    return /*#__PURE__*/_react["default"].createElement(Tab.Navigator, {
      initialRouteName: config.initialRouteName,
      screenOptions: config.screenOptions || {}
    }, (config.screens || []).map(function (screen, i) {
      if (screen.type === 'stack' || screen.type === 'tab') {
        return /*#__PURE__*/_react["default"].createElement(Tab.Screen, {
          key: screen.name || "tab".concat(i),
          name: screen.name || "tab".concat(i),
          component: wrapNavigator(function () {
            return _renderStack(screen);
          }),
          options: screen.options || {}
        });
      }
      return /*#__PURE__*/_react["default"].createElement(Tab.Screen, {
        key: screen.name || "screen".concat(i),
        name: screen.name || "screen".concat(i),
        component: screen.component || _reactNative.View,
        options: screen.options || {}
      });
    }));
  }
  if (config.component) {
    var Comp = config.component;
    return /*#__PURE__*/_react["default"].createElement(Comp, null);
  }
  return null;
};

/* ---------- NavigationProvider component (memoize map & flush queue) ---------- */
var NavigationProvider = exports.NavigationProvider = function NavigationProvider(_ref) {
  var config = _ref.config;
  // memoize map for performance; JSON.stringify is OK for moderate config sizes
  var screenPathMap = _react["default"].useMemo(function () {
    return buildScreenPathMap(config);
  }, [JSON.stringify(config)]);

  // expose the map to the module-scoped variable used by helpers
  _react["default"].useEffect(function () {
    // replace module-level map reference
    moduleScreenMap.set(screenPathMap);
  }, [screenPathMap]);

  // when navigation becomes ready, flush queued actions
  var onReady = function onReady() {
    flushPending();
  };
  return /*#__PURE__*/_react["default"].createElement(_native.NavigationContainer, {
    ref: navigationRef,
    onReady: onReady
  }, _renderStack(config));
};
var _default = exports["default"] = NavigationProvider;
/* ---------- module-level holder for current map (so helpers can access latest) ---------- */
var moduleScreenMap = function () {
  var current = {};
  return {
    set: function set(m) {
      current = m || {};
    },
    get: function get() {
      return current;
    }
  };
}();

/* ---------- exported helpers using the moduleScreenMap ---------- */
function isReady() {
  return navigationRef && navigationRef.isReady && navigationRef.isReady();
}
function _getPathForName(name) {
  var map = moduleScreenMap.get();
  var entry = map[name];
  if (!entry) return null;
  // if duplicates stored as array return first by default; you can expose API to pick one
  return Array.isArray(entry) ? entry[0] : entry;
}
function navigateTo(name, params) {
  var path = _getPathForName(name);
  if (!path) {
    // eslint-disable-next-line no-console
    console.warn("[NavigationProvider] navigateTo: no path found for \"".concat(name, "\""));
    return;
  }
  enqueueOrRun(function () {
    if (path.length === 1) {
      navigationRef.navigate(path[0], params);
      return;
    }
    var nested = _buildNestedParams(path.slice(1), params);
    navigationRef.navigate(path[0], nested);
  });
}
function navigateToStack(stackName) {
  return navigateTo(stackName, undefined);
}
function navigateNested(rootName, nested) {
  enqueueOrRun(function () {
    navigationRef.navigate(rootName, nested);
  });
}
function resetToScreen(name, params) {
  var path = _getPathForName(name);
  if (!path) {
    // eslint-disable-next-line no-console
    console.warn("[NavigationProvider] resetToScreen: no path found for \"".concat(name, "\""));
    return;
  }
  enqueueOrRun(function () {
    var routes = buildResetRoutesFromPath(path, params);
    navigationRef.dispatch(_native.CommonActions.reset({
      index: 0,
      routes: routes
    }));
  });
}
function replaceInCurrent(name, params) {
  enqueueOrRun(function () {
    navigationRef.dispatch(_native.CommonActions.replace(name, params));
  });
}

/* exports */