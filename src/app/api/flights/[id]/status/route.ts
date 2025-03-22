import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/config';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const flightId = params.id;

  // Verify that the flight exists
  const { data: flight, error } = await supabase
    .from('flights')
    .select('*')
    .eq('id', flightId)
    .single();

  if (error || !flight) {
    return new NextResponse(JSON.stringify({ error: 'Flight not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Set up SSE headers
  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', 'text/event-stream');
  responseHeaders.set('Cache-Control', 'no-cache');
  responseHeaders.set('Connection', 'keep-alive');

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Send initial flight status
  const initialUpdate = {
    flightId: flight.id,
    status: flight.status,
    message: `Current status: ${flight.status}`,
    timestamp: new Date().toISOString(),
  };

  writer.write(
    `data: ${JSON.stringify(initialUpdate)}\n\n`
  );

  // Set up interval to check for updates
  const interval = setInterval(async () => {
    try {
      const { data: updatedFlight, error: updateError } = await supabase
        .from('flights')
        .select('*')
        .eq('id', flightId)
        .single();

      if (!updateError && updatedFlight) {
        const update = {
          flightId: updatedFlight.id,
          status: updatedFlight.status,
          message: `Flight ${updatedFlight.flight_number} status: ${updatedFlight.status}`,
          timestamp: new Date().toISOString(),
        };

        writer.write(
          `data: ${JSON.stringify(update)}\n\n`
        );
      }
    } catch (err) {
      console.error('Error checking flight updates:', err);
    }
  }, 10000); // Check every 10 seconds

  // Clean up on client disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(interval);
    writer.close();
  });

  return new NextResponse(stream.readable, {
    headers: responseHeaders,
  });
}
