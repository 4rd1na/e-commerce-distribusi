import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileHeaderProps {
    fullName: string;
    email: string;
    avatarUrl?: string;
    onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: () => void;
    uploading: boolean;
}

export default function ProfileHeader({
    fullName,
    email,
    avatarUrl,
    onUpload,
    onDelete,
    uploading,
}: ProfileHeaderProps) {
    const initials = fullName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "👤";

    return (
        <div className="flex items-center gap-5 p-5 border rounded-2xl bg-white shadow-sm">
            {/* Sisi Kiri: Avatar + Input File Hidden */}
            <div className="flex flex-col items-center gap-2">
                <label className={`relative group ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <Avatar className="h-20 w-20 border-2 border-slate-100 transition group-hover:brightness-90">
                        {/* Jika avatarUrl ada, tampilkan. Jika tidak, dia otomatis lempar ke Fallback */}
                        <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold text-xl">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Lapisan hover teks "Ganti" */}
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploading ? "..." : "Ganti"}
                    </div>

                    {/* Input file asli disembunyikan agar trigger lewat klik avatar */}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={onUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>

                {/* Tombol Hapus jika foto profil bukan default */}
                {avatarUrl && (
                    <button
                        onClick={onDelete}
                        disabled={uploading}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                        Hapus Foto
                    </button>
                )}
            </div>

            {/* Sisi Kanan: Nama & Email */}
            <div>
                <h1 className="font-bold text-xl text-slate-800 leading-tight">
                    {fullName || "Nama Pengguna"}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    {email}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                    *Klik foto untuk mengubah gambar (Maks. 2MB)
                </p>
            </div>
        </div>
    );
}