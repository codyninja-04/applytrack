export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-[92px]" />
        ))}
      </div>
      <div className="skeleton h-[300px]" />
    </div>
  )
}
