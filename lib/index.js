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
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; } /* src/index.js */
var Stack = (0, _stack.createStackNavigator)();
var Tab = (0, _bottomTabs.createBottomTabNavigator)();

/* navigation ref so helpers can act from anywhere */
var navigationRef = exports.navigationRef = (0, _native.createNavigationContainerRef)();

/* map of name -> path (path is array of navigator/screen names to reach it) */
var screenPathMap = {};

/* ---------- Build map: map every node name (navigator or screen) to its path ---------- */
var buildScreenPathMap = function buildScreenPathMap(config) {
  screenPathMap = {};
  var _walk = function walk(node) {
    var parentPath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    if (!node) return;
    var currentPath = node.name ? parentPath.concat(node.name) : parentPath;

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
      node.screens.forEach(function (child) {
        return _walk(child, currentPath);
      });
    }
  };
  _walk(config, []);
};

/* ---------- Helpers to build nested params / reset routes ---------- */
var _buildNestedParams = function buildNestedParams(subPath, finalParams) {
  // subPath e.g. ['HomeStack','Home']
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
  // path example: ['MainTab','HomeStack','Home']
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

  // recursive builder for nested state
  var _stateFor = function stateFor(sub) {
    // sub is like ['HomeStack','Home']
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

/* ---------- navigator renderers (recursive) ---------- */
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

  // leaf component
  if (config.component) {
    var Comp = config.component;
    return /*#__PURE__*/_react["default"].createElement(Comp, null);
  }
  return null;
};

/* ---------- NavigationProvider component (build map & render) ---------- */
var NavigationProvider = exports.NavigationProvider = function NavigationProvider(_ref) {
  var config = _ref.config;
  // Build the map each render (cheap). If needed, memoize on config.
  buildScreenPathMap(config);
  return /*#__PURE__*/_react["default"].createElement(_native.NavigationContainer, {
    ref: navigationRef
  }, _renderStack(config));
};
var _default = exports["default"] = NavigationProvider;
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
  var path = screenPathMap[name];
  if (!path) {
    console.warn("[NavigationProvider] navigateTo: no path found for \"".concat(name, "\""));
    return;
  }
  if (!isReady()) return;

  // if root-level
  if (path.length === 1) {
    navigationRef.navigate(path[0], params);
    return;
  }

  // navigate to root and pass nested params
  var nested = _buildNestedParams(path.slice(1), params);
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
  var path = screenPathMap[name];
  if (!path) {
    console.warn("[NavigationProvider] resetToScreen: no path found for \"".concat(name, "\""));
    return;
  }
  if (!isReady()) return;
  var routes = buildResetRoutesFromPath(path, params);
  navigationRef.dispatch(_native.CommonActions.reset({
    index: 0,
    routes: routes
  }));
}

/**
 * replaceInCurrent: replace current route in focused navigator (like CommonActions.replace)
 */
function replaceInCurrent(name, params) {
  if (!isReady()) return;
  navigationRef.dispatch(_native.CommonActions.replace(name, params));
}

/* exports */