export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">403</h1>

        <p className="mt-2 text-muted-foreground">
          Anda tidak memiliki izin mengakses halaman ini.
        </p>
      </div>
    </div>
  );
}