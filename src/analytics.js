const siteCode = document.querySelector('meta[name="goatcounter-site-code"]')?.content.trim() || "";

if (siteCode && /^[a-z0-9][a-z0-9-]*$/.test(siteCode)) {
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.v5.js";
  script.dataset.goatcounter = `https://${siteCode}.goatcounter.com/count`;
  script.crossOrigin = "anonymous";
  script.integrity = "sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ";
  document.head.append(script);
}
