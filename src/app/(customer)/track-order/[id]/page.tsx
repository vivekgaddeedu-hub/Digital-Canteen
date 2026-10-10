import React from 'react';
import TrackOrderClient from './TrackOrderClient';

export const metadata = {
  title: 'Track Order | QuickBite Digital Canteen',
  description: 'Live order lifecycle tracking and counter pickup instructions',
};

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TrackOrderClient orderId={id} />;
}
