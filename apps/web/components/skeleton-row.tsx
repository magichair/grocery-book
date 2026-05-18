export default function SkeletonRow() {
  return (
    <div className="flex items-center px-4 py-3 border-b border-slate-100 min-h-[56px]">
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-slate-200 rounded animate-pulse w-2/3" />
        <div className="h-3 bg-slate-200 rounded animate-pulse w-1/3" />
      </div>
      <div className="h-4 bg-slate-200 rounded animate-pulse w-14 ml-3 shrink-0" />
    </div>
  )
}
