import { Tabs } from "expo-router";

import { tabOptions, tabScreenOptions } from "./tabs-shared";

export function ParentTabs() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={tabOptions("Home", "home-outline")} />
      <Tabs.Screen name="kids" options={tabOptions("Kids", "people-outline")} />
      <Tabs.Screen name="drivers" options={tabOptions("Drivers", "car-outline")} />
      <Tabs.Screen name="trips" options={tabOptions("Trips", "map-outline")} />
      <Tabs.Screen name="more" options={tabOptions("More", "menu-outline")} />
    </Tabs>
  );
}
