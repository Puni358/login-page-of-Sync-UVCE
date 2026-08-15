import type { ProductCategory } from "@/lib/marketplace/types"
import { BookOpen, Calculator, Cpu, FlaskConical } from "lucide-react"

export function CategoryIcon({
  category,
  className = "w-6 h-6",
}: {
  category: ProductCategory
  className?: string
}) {
  switch (category) {
    case "books":
      return <BookOpen className={className} />
    case "lab-tools":
      return <FlaskConical className={className} />
    case "calculators":
      return <Calculator className={className} />
    case "small-electronics":
      return <Cpu className={className} />
  }
}
