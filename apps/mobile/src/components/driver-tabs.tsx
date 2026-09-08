import { Tabs } from "expo-router";

import { tabOptions, tabScreenOptions } from "./tabs-shared";

export function DriverTabs() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={tabOptions("Home", "home-outline")} />
      <Tabs.Screen name="families" options={tabOptions("Families", "people-outline")} />
      <Tabs.Screen name="trips" options={tabOptions("Trips", "map-outline")} />
      <Tabs.Screen name="more" options={tabOptions("More", "menu-outline")} />
    </Tabs>
  );
}
