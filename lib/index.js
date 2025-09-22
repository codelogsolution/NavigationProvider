"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resetToScreen = exports.replaceInCurrent = exports.navigationRef = exports.navigateToStack = exports.navigateTo = exports["default"] = exports.NavigationProvider = void 0;
var _react = _interopRequireDefault(require("react"));
var _native = require("@react-navigation/native");
var _stack = require("@react-navigation/stack");
var _bottomTabs = require("@react-navigation/bottom-tabs");
var _reactNative = require("react-native");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _toArray(r) { return _arrayWithHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; } // src/index.js
var Stack = (0, _stack.createStackNavigator)();
var Tab = (0, _bottomTabs.createBottomTabNavigator)();

// --------------------
// Navigation Ref (for helpers)
// --------------------
var navigationRef = exports.navigationRef = (0, _native.createNavigationContainerRef)();

// --------------------
// Screen Path Map
// --------------------
var screenPathMap = {};

/**
 * Recursively build a map: screen or navigator name -> path array
 */
var buildScreenPathMap = function buildScreenPathMap(config) {
  screenPathMap = {};
  var _walk = function walk(node) {
    var parentPath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    if (!node) return;
    var currentPath = node.name ? [].concat(_toConsumableArray(parentPath), [node.name]) : parentPath;
    if (node.name && !screenPathMap[node.name]) {
      screenPathMap[node.name] = currentPath;
    }
    if (Array.isArray(node.screens)) {
      node.screens.forEach(function (child) {
        return _walk(child, currentPath);
      });
    }
  };
  _walk(config, []);
};

// --------------------
// Helper: wrap nested navigator
// --------------------
var wrapNavigator = function wrapNavigator(renderFn) {
  return function () {
    return /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, renderFn());
  };
};

// --------------------
// Render Stack / Tab recursively
// --------------------
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

  // leaf screen
  if (config.component) {
    var Comp = config.component;
    return /*#__PURE__*/_react["default"].createElement(Comp, null);
  }
  return null;
};

// --------------------
// NavigationProvider Component
// --------------------
var NavigationProvider = exports.NavigationProvider = function NavigationProvider(_ref) {
  var config = _ref.config;
  buildScreenPathMap(config);
  return /*#__PURE__*/_react["default"].createElement(_native.NavigationContainer, {
    ref: navigationRef
  }, _renderStack(config));
};
var _default = exports["default"] = NavigationProvider; // --------------------
// Navigation Helpers
// --------------------
function isReady() {
  return navigationRef && navigationRef.isReady && navigationRef.isReady();
}

/**
 * Navigate to any screen or navigator by name.
 * Example: navigateTo('Home') or navigateTo('HomeStack')
 */
var navigateTo = exports.navigateTo = function navigateTo(name, params) {
  var path = screenPathMap[name];
  if (!path) {
    console.warn("[NavigationProvider] navigateTo: \"".concat(name, "\" not found"));
    return;
  }
  if (!isReady()) return;
  if (path.length === 1) {
    navigationRef.navigate(path[0], params);
    return;
  }
  var _buildNested = function buildNested(subPath, finalParams) {
    if (!subPath || subPath.length === 0) return undefined;
    var _subPath = _toArray(subPath),
      first = _subPath[0],
      rest = _subPath.slice(1);
    if (rest.length === 0) return {
      screen: first,
      params: finalParams
    };
    return {
      screen: first,
      params: _buildNested(rest, finalParams)
    };
  };
  navigationRef.navigate(path[0], _buildNested(path.slice(1), params));
};

/**
 * Navigate to a stack navigator itself (e.g. HomeStack)
 */
var navigateToStack = exports.navigateToStack = function navigateToStack(stackName) {
  navigateTo(stackName);
};

/**
 * Reset navigation state to a screen (cross-stack replace)
 */
var resetToScreen = exports.resetToScreen = function resetToScreen(name, params) {
  var path = screenPathMap[name];
  if (!path) {
    console.warn("[NavigationProvider] resetToScreen: \"".concat(name, "\" not found"));
    return;
  }
  if (!isReady()) return;
  var buildReset = function buildReset(pathArr, finalParams) {
    if (!pathArr || pathArr.length === 0) return [];
    var _pathArr = _toArray(pathArr),
      root = _pathArr[0],
      rest = _pathArr.slice(1);
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
        if (sub[0] === pathArr[pathArr.length - 1] && finalParams) rr.params = finalParams;
        return {
          routes: [rr]
        };
      }
      var _sub = _toArray(sub),
        cur = _sub[0],
        restSub = _sub.slice(1);
      return {
        routes: [{
          name: cur,
          state: _stateFor(restSub)
        }]
      };
    };
    return [{
      name: root,
      state: _stateFor(rest)
    }];
  };
  var routes = buildReset(path, params);
  navigationRef.dispatch(_native.CommonActions.reset({
    index: 0,
    routes: routes
  }));
};

/**
 * Replace in current navigator (normal React Navigation replace)
 */
var replaceInCurrent = exports.replaceInCurrent = function replaceInCurrent(name, params) {
  if (!isReady()) return;
  navigationRef.dispatch(_native.CommonActions.replace(name, params));
};