import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories as defaultCategories } from '@/constants/tips';

const USER_CATEGORIES_KEY = 'morex.userCategories.v0';

export const DEFAULT_USER_CATEGORIES = defaultCategories.filter((category) => category !== 'その他');

function normalizeCategory(category: string) {
  return category.trim().replace(/\s+/g, ' ');
}

function uniqueCategories(items: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  items.forEach((item) => {
    const category = normalizeCategory(item);
    const key = category.toLowerCase();
    if (!category || seen.has(key)) return;
    seen.add(key);
    result.push(category);
  });

  return result;
}

export async function getUserCategories(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(USER_CATEGORIES_KEY);
  if (!raw) return [...DEFAULT_USER_CATEGORIES];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_USER_CATEGORIES];
    return uniqueCategories(parsed.filter((item): item is string => typeof item === 'string'));
  } catch {
    return [...DEFAULT_USER_CATEGORIES];
  }
}

export async function saveUserCategories(categories: string[]) {
  await AsyncStorage.setItem(USER_CATEGORIES_KEY, JSON.stringify(uniqueCategories(categories)));
}

export async function addUserCategory(category: string) {
  const current = await getUserCategories();
  const next = uniqueCategories([...current, category]);
  await saveUserCategories(next);
  return next;
}

export async function renameUserCategory(oldCategory: string, newCategory: string) {
  const current = await getUserCategories();
  const normalizedOld = normalizeCategory(oldCategory).toLowerCase();
  const next = uniqueCategories(
    current.map((category) =>
      category.toLowerCase() === normalizedOld ? newCategory : category,
    ),
  );
  await saveUserCategories(next);
  return next;
}

export async function deleteUserCategory(categoryToDelete: string) {
  const current = await getUserCategories();
  const normalizedDelete = normalizeCategory(categoryToDelete).toLowerCase();
  const next = current.filter((category) => category.toLowerCase() !== normalizedDelete);
  await saveUserCategories(next);
  return next;
}

export async function resetUserCategories() {
  await saveUserCategories([...DEFAULT_USER_CATEGORIES]);
  return [...DEFAULT_USER_CATEGORIES];
}
