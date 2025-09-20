import { ReactNode } from 'react';
import { StackNavigationOptions } from '@react-navigation/stack';

export interface NavigationProviderProps {
  children: ReactNode[];
  initialRouteName?: string;
  screenOptions?: StackNavigationOptions;
}

/**
 * NavigationProvider wraps screens with NavigationContainer & Stack.Navigator
 */
export declare const NavigationProvider: (props: NavigationProviderProps) => JSX.Element;

export default NavigationProvider;
