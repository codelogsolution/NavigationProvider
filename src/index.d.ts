import React from 'react';
import { StackNavigationOptions } from '@react-navigation/stack';

interface NavigationProviderProps {
  children: React.ReactNode;
  initialRouteName?: string;
  screenOptions?: StackNavigationOptions;
}

export const NavigationProvider: React.FC<NavigationProviderProps>;

export default NavigationProvider;
