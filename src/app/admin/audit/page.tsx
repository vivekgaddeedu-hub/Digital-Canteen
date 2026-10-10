import React from 'react';
import prisma from '@/lib/prisma';
import { History, ShieldAlert, User, Terminal } from 'lucide-react';

export const revalidate = 0;

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: {
      user: { select: { name: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-stone-200">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">System Audit Log</h1>
        <p className="text-xs text-stone-500">
          Immutable trail of administrative operations, order status transitions, and inventory updates.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {(logs || []).map((log: any) => (
                <tr key={log.id} className="hover:bg-stone-50 transition text-[11px]">
                  <td className="py-3 px-4 text-stone-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-stone-900">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    {log.entityType} ({log.entityId.slice(0, 8)}...)
                  </td>
                  <td className="py-3 px-4 font-sans">
                    {log.user ? (
                      <div>
                        <span className="font-bold text-stone-900">{log.user.name}</span>
                        <span className="text-[10px] text-stone-400 block font-mono">
                          {log.user.role}
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-400">System</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-stone-500 max-w-xs truncate">
                    {log.details || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
