import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Wrap nested navigators as valid components
const wrapNavigator = (renderFn) => () => <>{renderFn()}</>;

// Recursive function to render stacks, tabs, and screens dynamically
const renderStack = (config) => {
  if (config.type === 'stack') {
    return (
      <Stack.Navigator
        initialRouteName={config.initialRouteName}
        screenOptions={config.screenOptions || {}}
      >
        {config.screens.map((screen, i) => {
          if (screen.type === 'stack' || screen.type === 'tab') {
            return (
              <Stack.Screen
                key={screen.name || `stack${i}`}
                name={screen.name || `stack${i}`}
                component={wrapNavigator(() => renderStack(screen))}
                options={screen.options || {}}
              />
            );
          } else {
            return (
              <Stack.Screen
                key={screen.name || `screen${i}`}
                name={screen.name || `screen${i}`}
                component={screen.component || View}
                options={screen.options || {}}
              />
            );
          }
        })}
      </Stack.Navigator>
    );
  } else if (config.type === 'tab') {
    return (
      <Tab.Navigator
        initialRouteName={config.initialRouteName}
        screenOptions={config.screenOptions || {}}
      >
        {config.screens.map((screen, i) => {
          if (screen.type === 'stack' || screen.type === 'tab') {
            return (
              <Tab.Screen
                key={screen.name || `tab${i}`}
                name={screen.name || `tab${i}`}
                component={wrapNavigator(() => renderStack(screen))}
                options={screen.options || {}}
              />
            );
          } else {
            return (
              <Tab.Screen
                key={screen.name || `screen${i}`}
                name={screen.name || `screen${i}`}
                component={screen.component || View}
                options={screen.options || {}}
              />
            );
          }
        })}
      </Tab.Navigator>
    );
  }
};

// Main provider
export const NavigationProvider = ({ config }) => {
  return <NavigationContainer>{renderStack(config)}</NavigationContainer>;
};

export default NavigationProvider;
