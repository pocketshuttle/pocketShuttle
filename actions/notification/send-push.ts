const url = 'https://api.onesignal.com/notifications?c=push';
const options = {
  method: 'POST',
  headers: {Authorization: '<authorization>', 'Content-Type': 'application/json'},
  body: '{"app_id":"YOUR_APP_ID","include_aliases":{"external_id":["<string>"],"onesignal_id":["<string>"]},"target_channel":"push","include_subscription_ids":["<string>"],"included_segments":["<string>"],"excluded_segments":["<string>"],"filters":[{"field":"tag","relation":"=","key":"<string>","value":"<string>"}],"contents":{"en":"<string>"},"headings":{"en":"<string>"},"subtitle":{"en":"<string>"},"name":"<string>","template_id":"<string>","custom_data":{},"ios_attachments":{"id":"<string>"},"big_picture":"<string>","huawei_big_picture":"<string>","adm_big_picture":"<string>","chrome_web_image":"<string>","small_icon":"<string>","huawei_small_icon":"<string>","adm_small_icon":"<string>","large_icon":"<string>","huawei_large_icon":"<string>","adm_large_icon":"<string>","chrome_web_icon":"<string>","firefox_icon":"<string>","chrome_web_badge":"<string>","android_channel_id":"<string>","existing_android_channel_id":"<string>","huawei_channel_id":"<string>","huawei_existing_channel_id":"<string>","huawei_category":"MARKETING","huawei_msg_type":"message","huawei_bi_tag":"<string>","priority":10,"ios_interruption_level":"active","ios_sound":"<string>","ios_badgeType":"None","ios_badgeCount":123,"android_accent_color":"<string>","huawei_accent_color":"<string>","url":"<string>","app_url":"<string>","web_url":"<string>","target_content_identifier":"<string>","buttons":[{"id":"<string>","text":"<string>","icon":"<string>"}],"web_buttons":[{"id":"<string>","text":"<string>","url":"<string>"}],"thread_id":"<string>","ios_relevance_score":123,"android_group":"<string>","adm_group":"<string>","ttl":259200,"collapse_id":"<string>","web_push_topic":"<string>","data":{},"content_available":true,"ios_category":"<string>","apns_push_type_override":"<string>","isIos":true,"isAndroid":true,"isHuawei":true,"isAnyWeb":true,"isChromeWeb":true,"isFirefox":true,"isSafari":true,"isWP_WNS":true,"isAdm":true,"send_after":"<string>","delayed_option":"<string>","delivery_time_of_day":"<string>","throttle_rate_per_minute":123,"enable_frequency_cap":true,"idempotency_key":"<string>"}'
};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error);
}