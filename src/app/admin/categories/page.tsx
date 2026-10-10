import React from 'react';
import prisma from '@/lib/prisma';
import { FolderTree } from 'lucide-react';

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const canteens = await prisma.canteen.findMany({
    include: {
      categories: {
        include: { _count: { select: { menuItems: true } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-stone-200">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Category Hierarchy</h1>
        <p className="text-xs text-stone-500">
          Categories organize dishes per campus dining hall.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(canteens || []).map((canteen: any) => (
          <div key={canteen.id} className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-stone-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-brand-600" />
              <span>{canteen.name}</span>
            </h2>

            <div className="space-y-2">
              {(canteen.categories || []).map((cat: any, idx: number) => (
                <div
                  key={cat.id}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-stone-800">{cat.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500">
                    {cat._count.menuItems} items
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
