import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface BotSettings {
    targetAssets: Array<AssetId>;
    enabled: boolean;
    dipThresholdPercent: number;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Trade {
    tradeType: string;
    assetId: AssetId;
    note: string;
    timestamp: number;
    quantity: number;
    assetName: string;
    priceUsd: number;
}
export interface RecurringBuyRule {
    assetId: AssetId;
    intervalDays: bigint;
    enabled: boolean;
    assetName: string;
    amountUsd: number;
}
export type AssetId = string;
export interface UserProfile {
    name: string;
}
export interface http_header {
    value: string;
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createRecurringBuyRule(rule: RecurringBuyRule): Promise<void>;
    createTrade(trade: Trade): Promise<void>;
    deleteRecurringBuyRule(assetId: AssetId): Promise<void>;
    deleteTrade(assetId: AssetId): Promise<void>;
    fetchCoinDetails(coinId: AssetId): Promise<string>;
    fetchCoinHistory(coinId: AssetId, days: bigint): Promise<string>;
    fetchPrices(coinIds: Array<AssetId>): Promise<string>;
    fetchTopCoins(): Promise<string>;
    getBotSettings(forUser: Principal): Promise<BotSettings | null>;
    getCallerBotSettings(): Promise<BotSettings | null>;
    getCallerRecurringBuyRules(): Promise<Array<RecurringBuyRule>>;
    getCallerTrades(): Promise<Array<Trade>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getTrades(forUser: Principal): Promise<Array<Trade>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateBotSettings(settings: BotSettings): Promise<void>;
    updateRecurringBuyRule(assetId: AssetId, updatedRule: RecurringBuyRule): Promise<void>;
    updateTrade(assetId: AssetId, updatedTrade: Trade): Promise<void>;
}
