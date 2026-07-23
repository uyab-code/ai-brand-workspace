export interface Client {
  id: string
  organization_id: string
  name: string
  description: string | null
  status: "active" | "inactive"
}

export interface BrandAsset {
  id: string
  client_id: string
  asset_type: "logo" | "guideline" | "reference" | "font"
  file_url: string | null
  font_name: string | null
  font_type: "primary" | "secondary" | "accent" | null
  brand_colors: { colors: string[] } | null
  brand_style: string | null
}
