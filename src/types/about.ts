interface AboutTypographyRecord {
  profile_id: string
  heading_family: string
  body_family: string
  accent_family: string
  heading_weight?: number
  body_weight?: number
  accent_weight?: number
  rationale: string
}

export interface AboutRecord {
  about_id: string
  label: string
  kicker?: string
  title: string
  short_blurb: string
  body: string[]
  typography?: AboutTypographyRecord
}
