import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-5 py-10">
      <Link href="/" className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 items-end justify-center gap-[3px] rounded-xl bg-blue-600 p-2.5"
        >
          <span className="h-[40%] w-1/4 rounded-[1px] bg-white" />
          <span className="h-[70%] w-1/4 rounded-[1px] bg-white" />
          <span className="h-full w-1/4 rounded-[1px] bg-white" />
        </span>
        <span className="text-lg font-semibold tracking-tight">
          Contagem Culto
        </span>
      </Link>
      {children}
    </div>
  );
}
