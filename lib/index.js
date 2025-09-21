"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.NavigationProvider = void 0;
var _react = _interopRequireDefault(require("react"));
var _native = require("@react-navigation/native");
var _stack = require("@react-navigation/stack");
var _bottomTabs = require("@react-navigation/bottom-tabs");
var _reactNative = require("react-native");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var Stack = (0, _stack.createStackNavigator)();
var Tab = (0, _bottomTabs.createBottomTabNavigator)();

// Wrap nested navigators as valid components
var wrapNavigator = function wrapNavigator(renderFn) {
  return function () {
    return /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, renderFn());
  };
};

// Recursive function to render stacks, tabs, and screens dynamically
var _renderStack = function renderStack(config) {
  if (config.type === 'stack') {
    return /*#__PURE__*/_react["default"].createElement(Stack.Navigator, {
      initialRouteName: config.initialRouteName,
      screenOptions: config.screenOptions || {}
    }, config.screens.map(function (screen, i) {
      if (screen.type === 'stack' || screen.type === 'tab') {
        return /*#__PURE__*/_react["default"].createElement(Stack.Screen, {
          key: screen.name || "stack".concat(i),
          name: screen.name || "stack".concat(i),
          component: wrapNavigator(function () {
            return _renderStack(screen);
          }),
          options: screen.options || {}
        });
      } else {
        return /*#__PURE__*/_react["default"].createElement(Stack.Screen, {
          key: screen.name || "screen".concat(i),
          name: screen.name || "screen".concat(i),
          component: screen.component || _reactNative.View,
          options: screen.options || {}
        });
      }
    }));
  } else if (config.type === 'tab') {
    return /*#__PURE__*/_react["default"].createElement(Tab.Navigator, {
      initialRouteName: config.initialRouteName,
      screenOptions: config.screenOptions || {}
    }, config.screens.map(function (screen, i) {
      if (screen.type === 'stack' || screen.type === 'tab') {
        return /*#__PURE__*/_react["default"].createElement(Tab.Screen, {
          key: screen.name || "tab".concat(i),
          name: screen.name || "tab".concat(i),
          component: wrapNavigator(function () {
            return _renderStack(screen);
          }),
          options: screen.options || {}
        });
      } else {
        return /*#__PURE__*/_react["default"].createElement(Tab.Screen, {
          key: screen.name || "screen".concat(i),
          name: screen.name || "screen".concat(i),
          component: screen.component || _reactNative.View,
          options: screen.options || {}
        });
      }
    }));
  }
};

// Main provider
var NavigationProvider = exports.NavigationProvider = function NavigationProvider(_ref) {
  var config = _ref.config;
  return /*#__PURE__*/_react["default"].createElement(_native.NavigationContainer, null, _renderStack(config));
};
var _default = exports["default"] = NavigationProvider;