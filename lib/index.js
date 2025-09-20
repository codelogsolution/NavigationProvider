"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.NavigationProvider = void 0;
var _react = _interopRequireDefault(require("react"));
var _native = require("@react-navigation/native");
var _stack = require("@react-navigation/stack");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var Stack = (0, _stack.createStackNavigator)();
var NavigationProvider = exports.NavigationProvider = function NavigationProvider(_ref) {
  var children = _ref.children,
    initialRouteName = _ref.initialRouteName,
    screenOptions = _ref.screenOptions;
  var screens = _react["default"].Children.toArray(children);
  return /*#__PURE__*/_react["default"].createElement(_native.NavigationContainer, null, /*#__PURE__*/_react["default"].createElement(Stack.Navigator, {
    initialRouteName: initialRouteName,
    screenOptions: screenOptions
  }, screens.map(function (child, i) {
    var _child$props;
    var Comp = child.type;
    var name = child.props && child.props.name || Comp.displayName || Comp.name || "Screen".concat(i + 1);
    return /*#__PURE__*/_react["default"].createElement(Stack.Screen, {
      key: name,
      name: name,
      component: Comp,
      options: ((_child$props = child.props) === null || _child$props === void 0 ? void 0 : _child$props.options) || {}
    });
  })));
};
var _default = exports["default"] = NavigationProvider;