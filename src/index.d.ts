import { JSX, ReactNode } from 'react';
import { StackNavigationOptions } from '@react-navigation/stack';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

interface ScreenConfig {
  name?: string;
  component?: React.ComponentType<any>;
  type?: 'stack' | 'tab' | 'screen';
  screens?: ScreenConfig[];
  options?: StackNavigationOptions | BottomTabNavigationOptions;
}

export interface NavigationProviderProps {
  config: ScreenConfig;
}

export declare const NavigationProvider: (props: NavigationProviderProps) => JSX.Element;

export default NavigationProvider;
