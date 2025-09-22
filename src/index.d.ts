/* src/index.d.ts */
import React, { JSX } from 'react';
import { ComponentType } from 'react';
import { StackNavigationOptions } from '@react-navigation/stack';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

export type ScreenConfig = {
  type?: 'stack' | 'tab' | 'screen';
  name?: string;
  component?: ComponentType<any>;
  screens?: ScreenConfig[];
  initialRouteName?: string;
  screenOptions?: StackNavigationOptions | BottomTabNavigationOptions;
  options?: StackNavigationOptions | BottomTabNavigationOptions;
};

export interface NavigationProviderProps {
  config: ScreenConfig;
}

export declare const NavigationProvider: (props: NavigationProviderProps) => JSX.Element;
export default NavigationProvider;

export declare const navigationRef: import('@react-navigation/native').NavigationContainerRef<any>;
export declare function navigateTo(name: string, params?: any): void;
export declare function navigateToStack(stackName: string): void;
export declare function navigateNested(rootName: string, nested?: any): void;
export declare function resetToScreen(name: string, params?: any): void;
export declare function replaceInCurrent(name: string, params?: any): void;
