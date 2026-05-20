export default function UnauthorizedPage() {
  return (
    <div className='flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center'>
      <h1 className='text-3xl font-bold'>Unauthorized</h1>
      <p className='text-white/70'>You do not have permission to view this page.</p>
    </div>
  );
}
