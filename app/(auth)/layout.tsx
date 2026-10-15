import { Marca } from "@/components/marca";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-10">
      <div className="flex justify-center">
        <Marca />
      </div>
      {children}
    </div>
  );
}
