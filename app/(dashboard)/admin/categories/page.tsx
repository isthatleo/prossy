import { PageHeader } from "@/components/shared/page-header"
import { TaxonomyManager } from "@/components/admin/taxonomy-manager"
import { requireRole } from "@/lib/auth/guards"
import { listCategoriesWithCounts } from "@/services/admin"

export const metadata = { title: "Categories" }

export default async function CategoriesPage() {
  await requireRole("admin")
  const categories = await listCategoriesWithCounts()

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Project categories"
        description="Group projects by research area. Deleting a category unlinks it from projects without deleting them."
      />
      <div className="mt-6">
        <TaxonomyManager
          kind="category"
          noun="Category"
          items={categories.map((category) => ({
            id: category.id,
            label: category.name,
            sublabel: category.description,
            count: category.projectCount,
          }))}
        />
      </div>
    </div>
  )
}
