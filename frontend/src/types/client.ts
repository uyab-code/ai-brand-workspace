export interface Client {
  id: string
  organization_id: string
  name: string
  description: string | null
  status: "active" | "inactive"
  logo_url?: string | null
}

export type ColorRole = "primary" | "secondary" | "accent"

export interface BrandColor {
  role: ColorRole
  hex: string
}

export interface BrandAsset {
  id: string
  client_id: string
  asset_type: "logo" | "guideline" | "reference" | "font"
  file_url: string | null
  font_name: string | null
  font_type: "primary" | "secondary" | "accent" | null
  brand_colors: { colors: BrandColor[] } | null
  brand_style: string | null
}
