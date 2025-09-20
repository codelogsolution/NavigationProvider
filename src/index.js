import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export const NavigationProvider = ({ children, initialRouteName, screenOptions }) => {
  const screens = React.Children.toArray(children);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={screenOptions}>
        {screens.map((child, i) => {
          const Comp = child.type;
          const name =
            (child.props && child.props.name) ||
            Comp.displayName ||
            Comp.name ||
            `Screen${i + 1}`;

          return (
            <Stack.Screen
              key={name}
              name={name}
              component={Comp}
              options={child.props?.options || {}}
            />
          );
        })}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default NavigationProvider;
