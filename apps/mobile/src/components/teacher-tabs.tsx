import { Tabs } from "expo-router";

import { tabOptions, tabScreenOptions } from "./tabs-shared";

export function TeacherTabs() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={tabOptions("Home", "home-outline")} />
      <Tabs.Screen name="trips" options={tabOptions("Trips", "map-outline")} />
      <Tabs.Screen
        name="notifications"
        options={tabOptions("Alerts", "notifications-outline")}
      />
      <Tabs.Screen name="profile" options={tabOptions("Profile", "person-outline")} />
    </Tabs>
  );
}
