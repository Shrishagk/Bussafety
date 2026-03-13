/**
 * SafeRide AI — App.tsx
 * Root component with React Navigation stack.
 */
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator }  from "@react-navigation/stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider }       from "react-native-safe-area-context";

import HomeScreen     from "@/screens/HomeScreen";
import DashboardScreen from "@/screens/DashboardScreen";

import {
  BusRouteSearchScreen,
  BusNearbyScreen,
  BusVerifyScreen,
  BusTripMonitorScreen,
} from "@/screens/BusScreens";

import {
  CabBookingScreen,
  CabDriverDetailsScreen,
  CabTripMonitorScreen,
} from "@/screens/CabScreens";

import { tokens } from "@/theme/tokens";
import realtimeService from "@/services/realtimeService";

const Stack = createStackNavigator();

const screenOptions = {
  headerStyle:       { backgroundColor: tokens.colors.bgCard },
  headerTintColor:   tokens.colors.primary,
  headerTitleStyle:  { fontWeight: "700" as const, fontSize: 17 },
  cardStyle:         { backgroundColor: tokens.colors.bg },
};

export default function App() {
  useEffect(() => {
    realtimeService.connect();
    return () => realtimeService.disconnect();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
            <Stack.Screen name="Home"           component={HomeScreen}           options={{ title: "🛡️ SafeRide AI" }} />

            {/* Bus flow */}
            <Stack.Screen name="BusRouteSearch" component={BusRouteSearchScreen} options={{ title: "Search Route" }} />
            <Stack.Screen name="BusNearby"      component={BusNearbyScreen}      options={{ title: "Nearby Buses" }} />
            <Stack.Screen name="BusVerify"      component={BusVerifyScreen}      options={{ title: "Verify Bus" }} />
            <Stack.Screen name="BusTripMonitor" component={BusTripMonitorScreen} options={{ title: "🛡️ Live Trip", headerShown: false }} />

            {/* Cab flow */}
            <Stack.Screen name="CabBooking"      component={CabBookingScreen}      options={{ title: "Book Cab" }} />
            <Stack.Screen name="CabDriverDetails"component={CabDriverDetailsScreen}options={{ title: "Driver Details" }} />
            <Stack.Screen name="CabTripMonitor"  component={CabTripMonitorScreen}  options={{ title: "🛡️ Live Trip", headerShown: false }} />

            {/* Dashboard */}
            <Stack.Screen name="Dashboard"      component={DashboardScreen}      options={{ title: "📊 Dashboard" }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
