import ItemList from "@/components/item-list"

type Props = { params: Promise<{ bookId: string }> }

export default async function BookPage({ params }: Props) {
  const { bookId } = await params
  return <ItemList bookId={bookId} />
}
