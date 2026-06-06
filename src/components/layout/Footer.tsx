export default function Footer() {
    return (<footer className="border-t bg-white"> <div className="container mx-auto px-4 py-6">

        <div className="flex flex-col md:flex-row items-center justify-between gap-3">

            <div>
                <h2 className="text-lg font-black text-emerald-600">
                    DinaMart
                </h2>

                <p className="text-xs text-slate-500">
                    Platform distribusi produk & mitra.
                </p>
            </div>

            <div className="text-xs text-slate-500 text-center md:text-right">
                © {new Date().getFullYear()} DinaMart
            </div>

        </div>

    </div>
    </footer>
    );

}
