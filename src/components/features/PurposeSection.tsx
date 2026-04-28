import React from 'react';
import Image from 'next/image';

const PurposeSection = () => {
  const cards = [
    {
      title: "AI Super Copilot helps your team get shit done",
      desc: "Super Agents operate as collegue, always learning, with infinite skills and memory.",
      img: "/feature/agent-1.png",
      tag: "NEW",
      span: "col-span-1"
    },
    {
      title: "AI Manager with all context of your company",
      desc: "Trac AI lives inside your work. Tasks, docs, conversations, decisions, and history fully understood.",
      img: "/feature/agent-2.png",
      span: "col-span-1"
    },
    {
      title: "Super simple to use, no training needed",
      desc: "Tasks, projects, teams, organized in a single hierarchy. Built to scale from first task to entire company.",
      img: "/feature/agent-3.png",
      span: "col-span-1"
    },
    {
      title: "Elon-like manager that give you all the reports you need",
      desc: "Dashboards of what team did, and accurate down to the millisecond of activity in Trac AI. Always Realtime. No manual updates.",
      img: "/feature/agent-4.png",
      span: "col-span-1"
    },
    {
      title: "Your own Slack/Whatsapp for work",
      desc: "Message teammates, send tasks, docs, files and projects. Every conversation stays connected to the work.",
      img: "/feature/agent-5.png",
      span: "col-span-1 lg:col-span-4"
    },
    {
      title: "A better Trello/Asana with no storage limits 😊",
      desc: "Give Audio Tasks, attach Docs, wikis, notes, subtasks, videos, resources, links and assign to team-mates, searchable, and always connected to your work.",
      img: "/feature/agent-6.png",
      span: "col-span-1 lg:col-span-4"
    },
    {
      title: "Ready-made templates to get going",
      desc: "Hundreds of templates for every team and use case. Built by Trac AI and the community. Ready out of the box.",
      img: "/feature/agent-7.png",
      span: "col-span-1 lg:col-span-4"
    }
  ];

  return (
    <section className="bg-[#f9f9f9] py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-[#242222] mb-16 tracking-tight">
          Built different. With purpose.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* Row 1 & 2: Large Cards */}
          {cards.slice(0, 4).map((card, i) => (
            <div key={i} className="lg:col-span-6 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[#242222]">{card.title}</h3>
                {card.tag && (
                  <span className="text-[10px] font-bold bg-[#7B61FF] text-white px-2 py-0.5 rounded-sm tracking-widest">
                    {card.tag}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-8 flex-grow">
                {card.desc.replace('ClickUp', 'Trac AI')}
              </p>
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                <Image
                  src={card.img}
                  alt={card.title}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ))}

          {/* Row 3: Smaller Cards */}
          {cards.slice(4).map((card, i) => (
            <div key={i + 4} className={`${card.span} bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col`}>
              <h3 className="text-lg font-bold text-[#242222] mb-3">{card.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-6 flex-grow">
                {card.desc.replace('ClickUp', 'Trac AI')}
              </p>
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                <Image
                  src={card.img}
                  alt={card.title}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PurposeSection;
