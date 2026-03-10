import Float "mo:core/Float";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Types
  type AssetId = Text;

  type Trade = {
    assetId : AssetId;
    assetName : Text;
    timestamp : Float;
    priceUsd : Float;
    quantity : Float;
    tradeType : Text;
    note : Text;
  };

  module Trade {
    public func compare(t1 : Trade, t2 : Trade) : Order.Order {
      switch (t1.assetId.compare(t2.assetId)) {
        case (#equal) { Float.compare(t1.timestamp, t2.timestamp) };
        case (order) { order };
      };
    };
  };

  type RecurringBuyRule = {
    assetId : AssetId;
    assetName : Text;
    intervalDays : Nat;
    amountUsd : Float;
    enabled : Bool;
  };

  module RecurringBuyRule {
    public func compare(r1 : RecurringBuyRule, r2 : RecurringBuyRule) : Order.Order {
      r1.assetId.compare(r2.assetId);
    };
  };

  type BotSettings = {
    dipThresholdPercent : Float;
    enabled : Bool;
    targetAssets : [AssetId];
  };

  public type UserProfile = {
    name : Text;
  };

  // State
  let trades = Map.empty<Principal, Map.Map<AssetId, Trade>>();
  let recurringBuyRules = Map.empty<Principal, Map.Map<AssetId, RecurringBuyRule>>();
  let botSettings = Map.empty<Principal, BotSettings>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Transform for HTTP outcalls
  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Trade CRUD
  public shared ({ caller }) func createTrade(trade : Trade) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create trades");
    };
    let userMap = switch (trades.get(caller)) {
      case (null) { Map.empty<AssetId, Trade>() };
      case (?map) { map };
    };
    userMap.add(trade.assetId, trade);
    trades.add(caller, userMap);
  };

  public query ({ caller }) func getTrades(forUser : Principal) : async [Trade] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };
    if (forUser != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view others' trades");
    };
    switch (trades.get(forUser)) {
      case (null) { [] };
      case (?userMap) {
        userMap.values().toArray().sort();
      };
    };
  };

  public query ({ caller }) func getCallerTrades() : async [Trade] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trades");
    };
    switch (trades.get(caller)) {
      case (null) { [] };
      case (?userMap) {
        userMap.values().toArray().sort();
      };
    };
  };

  public shared ({ caller }) func updateTrade(assetId : AssetId, updatedTrade : Trade) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update trades");
    };
    switch (trades.get(caller)) {
      case (null) { Runtime.trap("Trade not found") };
      case (?map) {
        if (not map.containsKey(assetId)) {
          Runtime.trap("Trade not found");
        };
        map.add(assetId, updatedTrade);
      };
    };
  };

  public shared ({ caller }) func deleteTrade(assetId : AssetId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete trades");
    };
    switch (trades.get(caller)) {
      case (null) { Runtime.trap("Trade not found") };
      case (?map) {
        if (not map.containsKey(assetId)) {
          Runtime.trap("Trade not found");
        };
        map.remove(assetId);
      };
    };
  };

  // Recurring Buy Rules CRUD
  public shared ({ caller }) func createRecurringBuyRule(rule : RecurringBuyRule) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create recurring buy rules");
    };
    let userMap = switch (recurringBuyRules.get(caller)) {
      case (null) { Map.empty<AssetId, RecurringBuyRule>() };
      case (?map) { map };
    };
    userMap.add(rule.assetId, rule);
    recurringBuyRules.add(caller, userMap);
  };

  public query ({ caller }) func getCallerRecurringBuyRules() : async [RecurringBuyRule] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view recurring buy rules");
    };
    switch (recurringBuyRules.get(caller)) {
      case (null) { [] };
      case (?userMap) {
        userMap.values().toArray().sort();
      };
    };
  };

  public shared ({ caller }) func updateRecurringBuyRule(assetId : AssetId, updatedRule : RecurringBuyRule) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update recurring buy rules");
    };
    switch (recurringBuyRules.get(caller)) {
      case (null) { Runtime.trap("Rule not found") };
      case (?map) {
        if (not map.containsKey(assetId)) {
          Runtime.trap("Rule not found");
        };
        map.add(assetId, updatedRule);
      };
    };
  };

  public shared ({ caller }) func deleteRecurringBuyRule(assetId : AssetId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete recurring buy rules");
    };
    switch (recurringBuyRules.get(caller)) {
      case (null) { Runtime.trap("Rule not found") };
      case (?map) {
        if (not map.containsKey(assetId)) {
          Runtime.trap("Rule not found");
        };
        map.remove(assetId);
      };
    };
  };

  // Bot Settings
  public shared ({ caller }) func updateBotSettings(settings : BotSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update bot settings");
    };
    botSettings.add(caller, settings);
  };

  public query ({ caller }) func getBotSettings(forUser : Principal) : async ?BotSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bot settings");
    };
    if (forUser != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view others' bot settings");
    };
    botSettings.get(forUser);
  };

  public query ({ caller }) func getCallerBotSettings() : async ?BotSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bot settings");
    };
    botSettings.get(caller);
  };

  // Helper function to join [AssetId] into comma-separated string
  func joinAssetIds(assetIds : [AssetId]) : Text {
    let iter = assetIds.values();
    switch (iter.next()) {
      case (null) { return "" };
      case (?first) {
        switch (iter.next()) {
          case (null) { return first };
          case (?second) {
            var result = first # "," # second;
            for (assetId in iter) {
              result #= "," # assetId;
            };
            result;
          };
        };
      };
    };
  };

  // HTTP Outcalls
  public shared ({ caller }) func fetchPrices(coinIds : [AssetId]) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch prices");
    };
    let idsText = joinAssetIds(coinIds);
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=" # idsText # "&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func fetchCoinHistory(coinId : AssetId, days : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch coin history");
    };
    let url = "https://api.coingecko.com/api/v3/coins/" # coinId # "/market_chart?vs_currency=usd&days=" # days.toText();
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func fetchTopCoins() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch top coins");
    };
    let url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d";
    await OutCall.httpGetRequest(url, [], transform);
  };

  public shared ({ caller }) func fetchCoinDetails(coinId : AssetId) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch coin details");
    };
    let url = "https://api.coingecko.com/api/v3/coins/" # coinId # "?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true";
    await OutCall.httpGetRequest(url, [], transform);
  };
};
