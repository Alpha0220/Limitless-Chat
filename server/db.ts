import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, userSettings, UserSettings, InsertUserSettings, personalizationMemories, InsertPersonalizationMemory, PersonalizationMemory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    }).execute();
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1).execute();
  console.log("[DEBUG] getUserByOpenId result:", result);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user settings by user ID
 */
export async function getUserSettings(userId: number): Promise<UserSettings | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user settings: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select({
        id: userSettings.id,
        userId: userSettings.userId,
        limitlessApiKey: userSettings.limitlessApiKey,
        openaiApiKey: userSettings.openaiApiKey,
        anthropicApiKey: userSettings.anthropicApiKey,
        selectedModel: userSettings.selectedModel,
        styleTone_baseTone: userSettings.styleTone_baseTone,
        styleTone_additionalPreferences: userSettings.styleTone_additionalPreferences,
        nickname: userSettings.nickname,
        occupation: userSettings.occupation,
        aboutUser_interests: userSettings.aboutUser_interests,
        aboutUser_values: userSettings.aboutUser_values,
        aboutUser_communicationPreferences: userSettings.aboutUser_communicationPreferences,
        memorySettings_allowSavedMemory: userSettings.memorySettings_allowSavedMemory,
        chatHistorySettings_allowReferenceHistory: userSettings.chatHistorySettings_allowReferenceHistory,
        createdAt: userSettings.createdAt,
        updatedAt: userSettings.updatedAt,
      })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1)
      .execute();

    if (result.length > 0) {
      console.log("[Settings] getUserSettings - Found:", { userId, model: result[0].selectedModel });
      console.log("[Settings] getUserSettings - Full result:", JSON.stringify(result[0], null, 2));
      return result[0];
    }
    console.log("[Settings] getUserSettings - No settings for userId:", userId);
    return undefined;
  } catch (error) {
    console.error("[Database] Failed to get user settings:", error);
    return undefined;
  }
}

/**
 * Upsert user settings (create or update)
 */
export async function upsertUserSettings(
  userId: number,
  settings: Partial<InsertUserSettings>
): Promise<UserSettings | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user settings: database not available");
    return undefined;
  }

  try {
    console.log("[Settings] upsertUserSettings - Saving:", { userId, nickname: settings.nickname, tone: settings.styleTone_baseTone });
    
    // Build the complete values object with all settings
    const values: InsertUserSettings = {
      userId,
      // API Keys
      limitlessApiKey: settings.limitlessApiKey || null,
      openaiApiKey: settings.openaiApiKey || null,
      anthropicApiKey: settings.anthropicApiKey || null,
      selectedModel: settings.selectedModel || null,
      // Personalization settings
      styleTone_baseTone: settings.styleTone_baseTone || null,
      styleTone_additionalPreferences: settings.styleTone_additionalPreferences || null,
      nickname: settings.nickname || null,
      occupation: settings.occupation || null,
      aboutUser_interests: settings.aboutUser_interests || null,
      aboutUser_values: settings.aboutUser_values || null,
      aboutUser_communicationPreferences: settings.aboutUser_communicationPreferences || null,
      memorySettings_allowSavedMemory: settings.memorySettings_allowSavedMemory !== undefined ? settings.memorySettings_allowSavedMemory : true,
      chatHistorySettings_allowReferenceHistory: settings.chatHistorySettings_allowReferenceHistory !== undefined ? settings.chatHistorySettings_allowReferenceHistory : true,
    };

    // Build update set from provided settings (only update fields that were explicitly provided)
    const updateSet: Record<string, unknown> = {};

    // API Keys
    if (settings.limitlessApiKey !== undefined) {
      updateSet.limitlessApiKey = settings.limitlessApiKey;
    }
    if (settings.openaiApiKey !== undefined) {
      updateSet.openaiApiKey = settings.openaiApiKey;
    }
    if (settings.anthropicApiKey !== undefined) {
      updateSet.anthropicApiKey = settings.anthropicApiKey;
    }
    if (settings.selectedModel !== undefined) {
      updateSet.selectedModel = settings.selectedModel;
    }
    
    // Personalization settings
    if (settings.styleTone_baseTone !== undefined) {
      updateSet.styleTone_baseTone = settings.styleTone_baseTone;
    }
    if (settings.styleTone_additionalPreferences !== undefined) {
      updateSet.styleTone_additionalPreferences = settings.styleTone_additionalPreferences;
    }
    if (settings.nickname !== undefined) {
      updateSet.nickname = settings.nickname;
    }
    if (settings.occupation !== undefined) {
      updateSet.occupation = settings.occupation;
    }
    if (settings.aboutUser_interests !== undefined) {
      updateSet.aboutUser_interests = settings.aboutUser_interests;
    }
    if (settings.aboutUser_values !== undefined) {
      updateSet.aboutUser_values = settings.aboutUser_values;
    }
    if (settings.aboutUser_communicationPreferences !== undefined) {
      updateSet.aboutUser_communicationPreferences = settings.aboutUser_communicationPreferences;
    }
    if (settings.memorySettings_allowSavedMemory !== undefined) {
      updateSet.memorySettings_allowSavedMemory = settings.memorySettings_allowSavedMemory;
    }
    if (settings.chatHistorySettings_allowReferenceHistory !== undefined) {
      updateSet.chatHistorySettings_allowReferenceHistory = settings.chatHistorySettings_allowReferenceHistory;
    }

    await db
      .insert(userSettings)
      .values(values)
      .onDuplicateKeyUpdate({
        set: updateSet,
      })
      .execute();

    console.log("[Settings] upsertUserSettings - Saved, fetching updated");
    // Return updated settings
    return getUserSettings(userId);
  } catch (error) {
    console.error("[Database] Failed to upsert user settings:", error);
    throw error;
  }
}

// TODO: add feature queries here as your schema grows.

/**
 * Get personalization settings by user ID
 * If no settings exist, create default settings
 */
export async function getPersonalizationSettings(userId: number): Promise<UserSettings | undefined> {
  let settings = await getUserSettings(userId);
  
  // If no settings exist, create default settings
  if (!settings) {
    console.log("[Personalization] Creating default settings for userId:", userId);
    const defaultSettings: Partial<InsertUserSettings> = {
      styleTone_baseTone: "friendly",
      memorySettings_allowSavedMemory: true,
      chatHistorySettings_allowReferenceHistory: true,
    };
    
    try {
      settings = await upsertUserSettings(userId, defaultSettings);
    } catch (error) {
      console.error("[Personalization] Failed to create default settings:", error);
      // Return undefined if creation fails, but don't throw
      return undefined;
    }
  }
  
  return settings;
}

/**
 * Update personalization settings
 */
export async function updatePersonalizationSettings(
  userId: number,
  settings: Partial<InsertUserSettings>
): Promise<UserSettings | undefined> {
  return upsertUserSettings(userId, settings);
}

/**
 * Reset personalization settings to defaults
 */
export async function resetPersonalizationToDefaults(userId: number): Promise<UserSettings | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot reset personalization: database not available");
    return undefined;
  }

  try {
    const defaultSettings: Partial<InsertUserSettings> = {
      styleTone_baseTone: "friendly",
      styleTone_additionalPreferences: null,
      nickname: null,
      occupation: null,
      aboutUser_interests: null,
      aboutUser_values: null,
      aboutUser_communicationPreferences: null,
      memorySettings_allowSavedMemory: true,
      chatHistorySettings_allowReferenceHistory: true,
    };

    return upsertUserSettings(userId, defaultSettings);
  } catch (error) {
    console.error("[Database] Failed to reset personalization:", error);
    throw error;
  }
}

/**
 * Get saved memories for a user
 */
export async function getSavedMemories(userId: number): Promise<PersonalizationMemory[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get memories: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(personalizationMemories)
      .where(eq(personalizationMemories.userId, userId))
      .execute();

    console.log("[Personalization] getSavedMemories - Found:", result.length, "memories");
    return result;
  } catch (error) {
    console.error("[Database] Failed to get memories:", error);
    return [];
  }
}

/**
 * Add a new memory for a user
 */
export async function addMemory(
  userId: number,
  memoryType: "user_preference" | "conversation_context" | "learned_info",
  content: string,
  source?: string
): Promise<PersonalizationMemory | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add memory: database not available");
    return undefined;
  }

  try {
    const memory: InsertPersonalizationMemory = {
      userId,
      memoryType,
      content,
      source: source || null,
    };

    await db.insert(personalizationMemories).values(memory).execute();

    console.log("[Personalization] addMemory - Added memory for user:", userId);
    return memory as PersonalizationMemory;
  } catch (error) {
    console.error("[Database] Failed to add memory:", error);
    throw error;
  }
}

/**
 * Clear all memories for a user
 */
export async function clearMemories(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot clear memories: database not available");
    return false;
  }

  try {
    await db
      .delete(personalizationMemories)
      .where(eq(personalizationMemories.userId, userId))
      .execute();

    console.log("[Personalization] clearMemories - Cleared all memories for user:", userId);
    return true;
  } catch (error) {
    console.error("[Database] Failed to clear memories:", error);
    throw error;
  }
}

/**
 * Get search personalization status (computed from memory + history settings)
 */
export async function getSearchPersonalizationStatus(userId: number): Promise<boolean> {
  const settings = await getUserSettings(userId);
  if (!settings) {
    return false;
  }

  // Search is enabled only if both memory and history are allowed
  return (
    settings.memorySettings_allowSavedMemory === true &&
    settings.chatHistorySettings_allowReferenceHistory === true
  );
}
