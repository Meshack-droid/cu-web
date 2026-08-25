import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '@/components/Card';
import { EVENT_TYPE_LABELS, fetchPublicEvents, formatEventDate } from '@/features/events/events.api';
import { CommunityArt } from '@/components/hero-art/CommunityArt';
import { PrayerArt } from '@/components/hero-art/PrayerArt';

function EventCardSkeleton(){return <Card variant="glass" className="animate-pulse"><div className="h-3 w-24 rounded bg-slate-200"/><div className="mt-4 h-6 w-3/4 rounded bg-slate-200"/><div className="mt-5 h-3 w-full rounded bg-slate-100"/><div className="mt-2 h-3 w-2/3 rounded bg-slate-100"/></Card>}

export function EventsPage(){
 const {data:events,isLoading,isError,refetch,isFetching}=useQuery({queryKey:['events','public'],queryFn:fetchPublicEvents,staleTime:30_000,retry:2});
 return <div className="overflow-hidden">
  <section className="mesh-hero-bg px-5 py-20 sm:px-6"><div className="page-shell grid items-center gap-12 lg:grid-cols-2"><div><span className="eyebrow"><Sparkles size={14}/> What&apos;s happening</span><h1 className="mt-6 text-5xl font-black tracking-tight text-primary-900 sm:text-6xl">Moments worth <span className="text-primary-500">showing up for.</span></h1><p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">From worship nights to retreats, conferences and missions — stay connected to the rhythm of TUMCU.</p></div><div className="surface-glass photo-frame p-8"><CommunityArt className="mx-auto w-full max-w-lg"/></div></div></section>
  <section className="page-shell section-pad"><div className="max-w-2xl"><span className="text-xs font-black tracking-[.2em] text-gold-600">UP NEXT</span><h2 className="mt-2 text-3xl font-black text-primary-900">Upcoming events</h2></div>
   {isError&&<Card variant="glass" className="mt-8 border-danger/20 p-7 text-center">
     <div className="mx-auto max-w-lg">
       <div className="text-lg font-black text-primary-900">Events are taking a moment to arrive.</div>
       <p className="mt-2 text-sm leading-6 text-slate-500">We couldn't reach the event service. Your connection may be temporary — try again without leaving this page.</p>
       <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-5 inline-flex items-center rounded-full bg-primary-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-600 disabled:opacity-60">
         {isFetching ? 'Retrying…' : 'Try again'}
       </button>
     </div>
   </Card>}
   <div className="mt-10 space-y-7">{isLoading&&Array.from({length:3}).map((_,i)=><EventCardSkeleton key={i}/>)}{events?.map((event,i)=><div key={event.id} className={`grid items-center gap-6 lg:grid-cols-[.65fr_1.35fr] ${i%2?'lg:[&>*:first-child]:order-2':''}`}><div className="surface-glass photo-frame p-7"><div className="aspect-[4/3] grid place-items-center">{i%2?<PrayerArt className="h-full w-full"/>:<CommunityArt className="h-full w-full"/>}</div></div><Card variant="glass" className="p-7 sm:p-9"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-bold text-gold-600">{EVENT_TYPE_LABELS[event.event_type]??'Event'}</span><span className="text-xs font-medium text-slate-400">TUMCU</span></div><h3 className="mt-4 text-2xl font-black text-primary-900 sm:text-3xl">{event.title}</h3>{event.description&&<p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{event.description}</p>}<div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-700"><CalendarDays size={16}/></span>{formatEventDate(event.start_at)}</div>{event.location&&<div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-700"><MapPin size={16}/></span>{event.location}</div>}</div><div className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary-700">Save the date <ArrowRight size={16}/></div></Card></div>)}</div>
   {!isLoading&&!isError&&events?.length===0&&<Card variant="glass" className="mt-10 text-center text-sm text-slate-500">No upcoming events right now — check back soon.</Card>}
  </section>
 </div>
}
