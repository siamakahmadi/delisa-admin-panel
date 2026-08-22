import { EditProduct } from "@/components/products/edit-product";

export default async function EditProductPage({ params }) {
  const { id } = await params;
  return <EditProduct id={id} />;
}
