import { Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useLocaleFont } from "@/hooks/useLocaleFont";
import { useTranslation } from "@/hooks/useTranslation";
import { ONBOARDING_KEY } from "@/app/onboarding";
const GUEST_KEY = "receipts_guest_mode_v1";

function NativeTabLayout() {
  const t = useTranslation();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "clock", selected: "clock.fill" }} />
        <Label>{t.tabs.timeline}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Icon sf={{ default: "magnifyingglass", selected: "magnifyingglass" }} />
        <Label>{t.tabs.search}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <Icon sf={{ default: "calendar", selected: "calendar" }} />
        <Label>{t.tabs.calendar}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>{t.tabs.settings}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const t = useTranslation();
  const font = useLocaleFont();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={70}
              tint={isDark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + "ee" }]} />
          ),
        tabBarLabelStyle: {
          fontFamily: font.medium,
          fontSize: 11,
          marginBottom: Platform.OS === "web" ? 8 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.timeline,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="clock" tintColor={color} size={22} />
            ) : (
              <Feather name="clock" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t.tabs.search,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="magnifyingglass" tintColor={color} size={22} />
            ) : (
              <Feather name="search" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t.tabs.calendar,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="calendar" tintColor={color} size={22} />
            ) : (
              <Feather name="calendar" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="gearshape" tintColor={color} size={22} />
            ) : (
              <Feather name="settings" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [guestMode, setGuestMode] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboarded(val === "true");
    });
  }, [isSignedIn]);

  useEffect(() => {
    AsyncStorage.getItem(GUEST_KEY).then((val) => setGuestMode(val === "true"));
  }, []);

  if (!isLoaded || (isSignedIn && onboarded === null) || guestMode === null) {
    return (
      <View style={{ flex: 1, backgroundColor: "#080808", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#a855f7" />
      </View>
    );
  }

  if (!isSignedIn && !guestMode) {
    return <ClassicTabLayout />;
  }
  if (!onboarded && isSignedIn) {
    return <ClassicTabLayout />;
  }

  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
