function defineFeatureFlags<T>(flags: T): Readonly<T> {
  return flags
}

export const features = defineFeatureFlags({ newNotification: false })
