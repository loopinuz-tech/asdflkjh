import React, { useState } from 'react'
import { Test, Question } from '@/lib/test-engine/types'
import { cn } from '@/lib/utils'
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  HelpCircle,
  ExternalLink,
  ZoomIn
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CDIELTSListeningDocumentProps {
  test: Test
  section: Test['sections'][0]
  sectionIndex: number
  session: {
    answers: Record<string, any>
    handleAnswerChange: (questionId: string, value: any) => void
    markedQuestions: Set<string>
    handleToggleMark: (questionId: string) => void
    isSubmitted?: boolean
    submissionResult?: any
  }
}

// -------------------------------------------------------------
// Audio Transcripts with highlighted answers for Version K5002
// -------------------------------------------------------------
const SCRIPTS_K5002: Record<number, { title: string; html: string }> = {
  1: {
    title: 'Part 1 Script — Job Details',
    html: `
      <p><strong>Man:</strong> Oh hello, I am calling about the part-time job you were advertising last week.</p>
      <p><strong>Manager:</strong> Oh you mean for the delivery driver? No, for a general assistant. My son is looking for a part-time job. I see. Well, we will shortly have a position available in our new Market Road branch. That is opening next month <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q1">or this one available right now in our branch in station road</mark> [Q1] and that is where the actual job advert was for.</p>
      <p><strong>Man:</strong> I see. It is definitely the current job I am calling about.</p>
      <p><strong>Manager:</strong> Right. Now there were a couple of options regarding working hours. We are really looking for someone that could do both Monday and Wednesday afternoons or the same hours on Thursday and Friday. <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q2">What about Sunday? That would work, provided he could do a full day.</mark> [Q2]</p>
      <p><strong>Man:</strong> That would not be a problem. Great. And what would the job involve exactly?</p>
      <p><strong>Manager:</strong> Let me just look at the job description for that particular job. Well, looks like there would be some working on the checkout, you know, taking payment for goods and I suppose our general assistants also <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q3">do rather a lot of lifting of some quite heavy items</mark> [Q3]. So good physical strength is quite important for this position. There is some assisting with customer inquiries as well. But we do not expect new staff to have much knowledge about the plants themselves. That is what the more experienced staff are there for. Then <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q4">especially in the summer, the plants need a lot of watering</mark> [Q4].</p>
      <p><strong>Man:</strong> I see. Well, I think you could manage all that. Good.</p>
      <p><strong>Manager:</strong> Now there are a few other qualifications and skills that the job calls for. <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q5">The first one being communication skills are important</mark> [Q5]. As you know, first impressions count for a lot. And the other thing we would be looking for in our applicants for this position is <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q6">he should have some ability in maths, a basic level at least</mark> [Q6].</p>
      <p><strong>Man:</strong> Well, he did well in that subject at school and he is polite and sociable too...</p>
      <p><strong>Manager:</strong> How about Wednesday, say about 10am?</p>
      <p><strong>Man:</strong> I am afraid that is the morning of his last exam. Could we make it later instead, perhaps at 2.30? <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q7">5 would be better for us</mark> [Q7].</p>
      <p><strong>Manager:</strong> Ok, that is fine. So his name is... It is Liam Avery. Ok, got that. So Liam will be having the interview with me. <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q8">My name is Maria Rapana. R-A-P for Peter, A-N-A</mark> [Q8]. On Tuesday, Liam needs to ring me on my direct line to confirm that he is coming <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q9">and that is 021 303 8874</mark> [Q9]. Ok. Oh, just one more thing. <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q10">I need to see Liam's passport at the interview</mark> [Q10] just to see that he is eligible to work in this country.</p>
    `
  },
  2: {
    title: 'Part 2 Script — Accommodation & Local Map',
    html: `
      <p><strong>Agent:</strong> ...Near the college, we have got a flat, a house or there is a student hostel all at about the same rent. But of course, they all have different features and different things included in the rent. The properties don't all have gardens, I am afraid. The house is quite small, not much space around it. It has got a bit of space at the back but I wouldn't call it a garden. The hostel is part of a city development so there is no space for a garden. But <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q11">the flat has a communal garden that is shared</mark> [Q11] by all the tenants.</p>
      <p><strong>Student:</strong> Have you got a car? Yes. There are garages around the corner from the house. Ah, but you have to rent those separately and they might not be available. But <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q12">each flat is allotted a garage in the grounds as part of the deal</mark> [Q12].</p>
      <p><strong>Agent:</strong> I guess you might also want to know about security as well. <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q13">The house is the only one which is alarmed</mark> [Q13]...</p>
      <p><strong>Agent:</strong> Now, they are all furnished. The stuff in the flat is quite modern looking... <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q14">All the furniture and fittings in the house have just been replaced</mark> [Q14] after the last tenants left so they will be in excellent condition.</p>
      <p><strong>Student:</strong> Well, I think I'd better go and look at them all. Where are they?</p>
      <p><strong>Agent:</strong> Here, let me show you on the map. Right. We're here in the accommodation agency on the High Street facing north. <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q15">Directly opposite us is the bank</mark> [Q15]. If you stay on this side of the road and walk towards West Street, the house is not that far. <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q16">It's next but one to the swimming pool just before West Street</mark> [Q16]. It's very convenient because it's near the shops. <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q17">The hostel is on the corner of West Street and St Anne's Road near the roundabout</mark> [Q17]. The flat is a bit of a walk but it's in very nice surroundings. To get to the flat, <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q18">you go down West Street towards the centre of the city and the building is on the corner just before the first turning on the left</mark> [Q18].</p>
      <p><strong>Agent:</strong> There's a post office just around the corner from here. <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q19">You go down the High Street and turn right into West Street and it's on your right</mark> [Q19]. Or if you want to go to the city centre, you could get the bus from here <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q20">just a few metres down the road from the agency going east. You don't even need to cross the road</mark> [Q20].</p>
    `
  },
  3: {
    title: 'Part 3 Script — Eyewitness Reliability',
    html: `
      <p><strong>Eleanor:</strong> You mean if a witness says something generally they're believed. And reading between the lines, I'd say that <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q21">when a witness gives evidence in a very self-assured way, everyone takes them at their word</mark> [Q21].</p>
      <p><strong>Jamie:</strong> Right. So is that textbook worth reading?</p>
      <p><strong>Eleanor:</strong> Yes, it's a good book... But actually, <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q22">some of the cases are more than 10 years old now</mark> [Q22].</p>
      <p><strong>Jamie:</strong> <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q22">Well, it's the same problem with the survey reports</mark> our tutor gave us...</p>
      <p><strong>Eleanor:</strong> But there can be good reasons for that, like an incident may happen at night in the dark. Or it happens some way away. <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q23">But it's the fact that it can happen in just a split second that makes the witnesses account so unreliable</mark> [Q23].</p>
      <p><strong>Jamie:</strong> Have you read anything about photo identifications? ...The case studies all clearly show how easy it is to sway a witness's choice of photo even just by the flicker of an eye.</p>
      <p><strong>Eleanor:</strong> Mostly. But the trouble is, <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q24">most people focus on the photos and choose the most likely suspect from the bunch and forget about the actual incident</mark> [Q24] and who they saw at the time.</p>
      <p><strong>Jamie:</strong> And I read something about a naive observer. Do you know what that is? Is it a witness who's never been in a court before?</p>
      <p><strong>Eleanor:</strong> Oh. I understood it to mean <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q25">someone who's had nothing to do with the event</mark> [Q25]...</p>
      <p><strong>Jamie:</strong> Another thing I read was that witnesses don't like to change their minds once they've made a particular statement. I thought people might worry about the fact that they told a lie in court...</p>
      <p><strong>Eleanor:</strong> But it's simply that <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q26">they're afraid of seeming unintelligent or lightweight</mark> [Q26]. Yeah. People are reluctant to lose face.</p>
      <p><strong>Eleanor:</strong> Yes. The rapport stage when a relationship between the child and the interviewer is built up seems to be crucial. But many children fail to say anything that provides any real information. <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q27">It must be hard for them not to feel a bit scared about being in a formal setting</mark> [Q27] like a court building.</p>
      <p><strong>Jamie:</strong> Still, it's a good lead-in to open-ended questions... But the handout discusses the issue of <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q28">children simply not understanding the specialist language used</mark> [Q28].</p>
      <p><strong>Eleanor:</strong> I think the stage called closed questions is easier for children to handle. They just have to answer yes or no. But everything's not so clear-cut in a child's world. And <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q29">abstract concepts such as honesty haven't been fully grasped by young children</mark> [Q29].</p>
      <p><strong>Jamie:</strong> You mean they make things up?</p>
      <p><strong>Eleanor:</strong> Apparently. And in the final stage, closure, where the interviewer has to check anything that hasn't been made clear to them by repeating previous questions, <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q30">children often become suspicious of the questioner</mark> [Q30].</p>
    `
  },
  4: {
    title: 'Part 4 Script — Plastics Exhibition',
    html: `
      <p><strong>Lecturer:</strong> ...One of the early semi-synthetic materials produced was the first commercially produced celluloid or plastic film, which was <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q31">made by dissolving cotton in a strong acid</mark> [Q31], such as nitric acid.</p>
      <p>They also <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q32">experimented with making plastics out of products derived from milk</mark> [Q32], but this didn't really work...</p>
      <p>One of the first uses of plastic was in the production of artificial fabric, and <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q33">the earliest successful one was a substitute for silk</mark> [Q33].</p>
      <p>The next significant breakthrough came in 1907 with the invention of Bakelite. This was the <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q34">first entirely synthetic plastic made in a laboratory</mark> [Q34].</p>
      <p>It was <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q35">invented by Hendrick Bakaland, a chemist</mark> [Q35] who had made a fortune from producing paper used in photographic processes.</p>
      <p>Bakelite is a pretty unusual type of plastic because <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q36">it actually gets hard when it's heated</mark> [Q36], whereas most other plastic becomes more malleable when hot...</p>
      <p>Some of the older plastics on display are unstable. This means that when they are in the process of degrading, <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q37">they may produce gases which are acidic</mark> [Q37], and which can cause neighboring objects in the display to disintegrate.</p>
      <p>We had to be very careful with these displays because there is <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q38">one thing which causes plastic objects to degrade or break down, and that is light</mark> [Q38].</p>
      <p>One of our most interesting is a magnificent chandelier... It's only when you look carefully that you can see this is a wonderful example of recycling. <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q39">It's made entirely of pens</mark> [Q39], ones which reuse and throw away every day.</p>
      <p>A second exhibit, which is drawing a lot of attention, is a car made entirely from plastic... It's made of a semi-synthetic plastic <mark class="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded" title="Q40">using materials derived from wood</mark> [Q40], which is obtained from managed plantations...</p>
    `
  }
}

export function CDIELTSListeningDocument({
  test,
  section,
  sectionIndex,
  session
}: CDIELTSListeningDocumentProps) {
  const [scriptModalOpen, setScriptModalOpen] = useState(false)
  const [mapModalOpen, setMapModalOpen] = useState(false)

  const partNum = sectionIndex + 1
  const allSectionQuestions = section.groups.flatMap(g => g.questions)
  const getQ = (qNum: number) => allSectionQuestions.find(q => q.question_number === qNum)

  // Check if this section has note card / passage HTML containing question markers
  const passageHtml = 
    (section as any).passage_html || 
    section.groups?.find(g => g.passage?.content)?.passage?.content || 
    (section as any).passage?.content || ''

  const hasEmbeddedQuestions = Boolean(
    passageHtml && 
    allSectionQuestions.some(q => {
      const reg = new RegExp(`\\[${q.question_number}\\]|id=["']q?${q.question_number}["']|data-question=["']${q.question_number}["']`, 'i')
      return reg.test(passageHtml)
    })
  )

  // Is this specific IELTS Version K5002 test?
  const isK5002 = 
    test.slug === 'ielts-listening-practice-test-1-k5002' ||
    Boolean(test.slug?.includes('k5002')) || 
    Boolean(test.title?.toLowerCase().includes('k5002'))

  // Helper for rendering an inline question badge + input field
  const renderInlineField = (
    qNum: number, 
    options?: { 
      short?: boolean; 
      prefixText?: string; 
      suffixText?: string;
      customWidth?: string;
      hideBadge?: boolean;
      placeholder?: string;
    }
  ) => {
    const q = getQ(qNum)
    if (!q) return null

    const userAns = session.answers[q.id] || ''
    const isMarked = session.markedQuestions.has(q.id)
    const isSubmitted = session.isSubmitted
    const qResult = session.submissionResult?.questionResults?.[q.id]
    const isCorrect = qResult 
      ? qResult.isCorrect 
      : (isSubmitted && q.correct_answer && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase())

    return (
      <span 
        id={`question-${q.id}`} 
        className={cn(
          "inline-flex items-center gap-1.5 my-1 align-baseline transition-all rounded px-1",
          isMarked && "bg-amber-100/60 dark:bg-amber-950/40 ring-1 ring-amber-400"
        )}
      >
        {options?.prefixText && <span className="text-neutral-800 dark:text-neutral-200">{options.prefixText}</span>}

        {/* Square Question Badge [31] */}
        {!options?.hideBadge && (
          <span 
            onClick={() => session.handleToggleMark(q.id)}
            title={isMarked ? "Flagged for review (Click to unflag)" : "Click to flag for review"}
            className={cn(
              "inline-flex items-center justify-center min-w-[28px] h-[26px] border-[1.5px] font-bold text-xs shrink-0 px-1 rounded-xs select-none cursor-pointer transition-colors shadow-2xs",
              isMarked
                ? "border-amber-500 bg-amber-400 text-black font-extrabold"
                : isSubmitted
                  ? isCorrect
                    ? "border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                    : "border-rose-600 bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200"
                  : "border-neutral-800 dark:border-neutral-300 text-neutral-900 dark:text-neutral-100 bg-neutral-100/80 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            )}
          >
            {qNum}
          </span>
        )}

        {/* CD-IELTS Text Input Field */}
        <span className="relative inline-flex items-center">
          <input
            type="text"
            value={userAns}
            disabled={isSubmitted}
            placeholder={options?.placeholder !== undefined ? options.placeholder : ""}
            maxLength={options?.short ? 2 : 45}
            onChange={(e) => session.handleAnswerChange(q.id, options?.short ? e.target.value.toUpperCase() : e.target.value)}
            className={cn(
              "border text-center font-medium rounded outline-none transition-all select-text shadow-2xs font-sans",
              options?.short 
                ? "w-[48px] h-[28px] text-sm uppercase font-bold" 
                : (options?.customWidth || "w-[120px] sm:w-[145px] h-[28px] text-sm px-2"),
              isSubmitted
                ? isCorrect
                  ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/40"
                  : "border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500/40"
                : "border-neutral-400 dark:border-zinc-500 bg-white dark:bg-zinc-900 text-neutral-900 dark:text-neutral-100 focus:border-[#005eb8] focus:ring-1 focus:ring-[#005eb8] focus:bg-blue-50/20"
            )}
          />

          {/* Feedback Icon in Review Mode */}
          {isSubmitted && (
            <span className="ml-1 shrink-0">
              {isCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{q.correct_answer}</span>
                </span>
              )}
            </span>
          )}
        </span>

        {options?.suffixText && <span className="text-neutral-800 dark:text-neutral-200">{options.suffixText}</span>}
      </span>
    )
  }

  // Helper for rendering Multiple Choice question (Part 3)
  const renderMCQ = (qNum: number, prompt: string, options: { key: string; text: string }[]) => {
    const q = getQ(qNum)
    if (!q) return null

    const userAns = session.answers[q.id] || ''
    const isSubmitted = session.isSubmitted
    const isCorrect = isSubmitted && String(userAns).trim().toUpperCase() === String(q.correct_answer).trim().toUpperCase()

    return (
      <div 
        id={`question-${q.id}`} 
        className={cn(
          "mb-6 p-2 rounded-lg transition-colors select-text scroll-mt-24",
          session.markedQuestions.has(q.id) && "bg-amber-100/40 dark:bg-amber-950/30 ring-1 ring-amber-400"
        )}
      >
        <p className="flex items-baseline gap-2.5 font-normal text-neutral-900 dark:text-neutral-100 text-[15px] mb-2 leading-relaxed">
          <span 
            onClick={() => session.handleToggleMark(q.id)}
            title="Click to flag question"
            className={cn(
              "inline-flex items-center justify-center min-w-[28px] h-[26px] border-[1.5px] font-bold text-xs shrink-0 px-1 rounded-xs select-none cursor-pointer",
              session.markedQuestions.has(q.id)
                ? "border-amber-500 bg-amber-400 text-black"
                : isSubmitted
                  ? isCorrect
                    ? "border-emerald-600 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                    : "border-rose-600 bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200"
                  : "border-neutral-800 dark:border-neutral-300 text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800"
            )}
          >
            {qNum}
          </span>
          <span className="font-medium text-foreground select-text">{prompt}</span>
        </p>

        <div className="space-y-1.5 pl-9">
          {options.map((opt) => {
            const isSelected = String(userAns).trim().toUpperCase() === opt.key.toUpperCase()
            const isOptCorrect = isSubmitted && String(q.correct_answer).trim().toUpperCase() === opt.key.toUpperCase()

            return (
              <label
                key={opt.key}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded border transition-all cursor-pointer text-sm select-text",
                  isSelected
                    ? "bg-[#c8ddf2] dark:bg-blue-950/70 border-[#005eb8]/60 text-foreground font-semibold"
                    : "border-transparent hover:bg-[#eef5fb] dark:hover:bg-zinc-800 text-foreground",
                  isSubmitted && isOptCorrect && "bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold",
                  isSubmitted && isSelected && !isCorrect && "bg-rose-100 dark:bg-rose-950 border-rose-500 text-rose-900 dark:text-rose-200",
                  isSubmitted && "cursor-default"
                )}
              >
                <input
                  type="radio"
                  name={`mcq-${q.id}`}
                  value={opt.key}
                  checked={isSelected}
                  disabled={isSubmitted}
                  onChange={() => session.handleAnswerChange(q.id, opt.key)}
                  className="accent-[#005eb8] w-4 h-4 cursor-pointer"
                />
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{opt.key}</span>
                <span className="select-text">{opt.text}</span>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  // Helper for rendering passage HTML with interactive React question inputs
  const renderPassageWithQuestions = (rawPassageHtml: string) => {
    // Matches <strong>[31]</strong>, [31], <input id="q31" />, <span class="drop-zone" data-question="31">
    const regex = /(?:<strong[^>]*>\s*)?\[(\d+)\](?:\s*<\/strong>)?|<input[^>]*id=["']q?(\d+)["'][^>]*>|<span[^>]*class=["'][^"']*drop-zone[^"']*["'][^>]*data-question=["'](\d+)["'][^>]*>(?:<\/span>)?/gi
    const segments: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(rawPassageHtml)) !== null) {
      const qNum = parseInt(match[1] || match[2] || match[3], 10)
      const textChunk = rawPassageHtml.substring(lastIndex, match.index)
      if (textChunk) {
        segments.push(
          <span
            key={`chunk-${lastIndex}`}
            dangerouslySetInnerHTML={{ __html: textChunk }}
          />
        )
      }
      const q = getQ(qNum)
      if (q) {
        segments.push(
          <span key={`q-${qNum}`} className="inline-block mx-1 align-baseline">
            {renderInlineField(qNum)}
          </span>
        )
      } else {
        segments.push(<span key={`fallback-${match.index}`}>{match[0]}</span>)
      }
      lastIndex = match.index + match[0].length
    }

    const remaining = rawPassageHtml.substring(lastIndex)
    if (remaining) {
      segments.push(
        <span
          key={`chunk-${lastIndex}`}
          dangerouslySetInnerHTML={{ __html: remaining }}
        />
      )
    }

    return (
      <div className="cd-ielts-passage-sheet select-text leading-relaxed">
        {segments}
      </div>
    )
  }

  return (
    <div className="max-w-4xl xl:max-w-5xl mx-auto pb-16 font-sans">
      
      {/* Authentic CD-IELTS White Sheet Container */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-lg shadow-sm p-5 sm:p-8 md:p-12 select-text">
        
        {/* Context Banner */}
        <div className="bg-[#f2f2f2] dark:bg-zinc-800/80 p-3.5 sm:p-4 rounded-md mb-6 flex flex-wrap items-center justify-between gap-3 border border-neutral-200 dark:border-zinc-700">
          <div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
              {section?.title || `Part ${partNum}`}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
              {allSectionQuestions.length > 0 ? (
                <>Listen and answer questions {allSectionQuestions[0].question_number}–{allSectionQuestions[allSectionQuestions.length - 1].question_number}.</>
              ) : (
                <>Listen and answer questions {partNum * 10 - 9}–{partNum * 10}.</>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setScriptModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#005eb8] hover:bg-[#00448a] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Script</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* PART 1: Job Details Form Completion (Q1–10)                   */}
        {/* ------------------------------------------------------------- */}
        {isK5002 && partNum === 1 && (
          <div className="space-y-6">
            <div className="text-[15px] leading-relaxed select-text">
              <strong className="block text-[16px] font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                Questions 1–10
              </strong>
              <p className="text-neutral-800 dark:text-neutral-200">
                Complete the form below. Write <strong className="font-bold text-black dark:text-white uppercase">ONE WORD AND/OR A NUMBER</strong> for each answer.
              </p>
            </div>

            <h2 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 pt-2 border-b pb-2 border-neutral-200 dark:border-zinc-800">
              Job Details
            </h2>

            {/* Grid Form */}
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-x-6 gap-y-3.5 items-center text-[15px] leading-normal">
              
              {/* Example */}
              <div className="text-neutral-600 dark:text-neutral-400 font-medium">Example:</div>
              <div className="text-neutral-900 dark:text-neutral-100 font-medium">Job title: general assistant</div>

              {/* Q1 */}
              <div className="text-neutral-800 dark:text-neutral-200 font-medium">Job available now in the:</div>
              <div>{renderInlineField(1, { suffixText: 'Branch' })}</div>

              {/* Q2 */}
              <div className="text-neutral-800 dark:text-neutral-200 font-medium">Days/hours of work:</div>
              <div>{renderInlineField(2, { suffixText: '(all day)' })}</div>

              {/* Duties Subheading */}
              <div className="col-span-1 md:col-span-2 font-bold text-base text-neutral-900 dark:text-neutral-100 pt-3 border-t border-neutral-100 dark:border-zinc-800">
                Duties:
              </div>

              {/* Q3 */}
              <div className="text-neutral-800 dark:text-neutral-200 font-medium">Working on checkout:</div>
              <div>{renderInlineField(3, { suffixText: 'Heavy items' })}</div>

              {/* Q4 */}
              <div className="text-neutral-800 dark:text-neutral-200 font-medium">Dealing with customer enquiries:</div>
              <div>{renderInlineField(4, { suffixText: 'The plants' })}</div>

              {/* Qualification required Subheading */}
              <div className="col-span-1 md:col-span-2 font-bold text-base text-neutral-900 dark:text-neutral-100 pt-3 border-t border-neutral-100 dark:border-zinc-800">
                Qualification required:
              </div>

              {/* Q5 */}
              <div className="text-neutral-800 dark:text-neutral-200 font-medium">Good:</div>
              <div>{renderInlineField(5, { suffixText: 'skills' })}</div>

              {/* Q6 */}
              <div className="text-neutral-800 dark:text-neutral-200 font-medium">Basic ability in:</div>
              <div>{renderInlineField(6, { suffixText: 'skills' })}</div>

              {/* Interview details Subheading */}
              <div className="col-span-1 md:col-span-2 font-bold text-base text-neutral-900 dark:text-neutral-100 pt-3 border-t border-neutral-100 dark:border-zinc-800">
                Interview details:
              </div>

              {/* Q7 */}
              <div className="text-neutral-800 dark:text-neutral-200 font-medium">Interview arranged for:</div>
              <div>{renderInlineField(7, { suffixText: 'on Wednesday this week' })}</div>

              {/* Q8 */}
              <div className="text-neutral-800 dark:text-neutral-200 font-medium">Name of interviewer:</div>
              <div>{renderInlineField(8, { prefixText: 'Maria' })}</div>

              {/* Q9 */}
              <div className="text-neutral-800 dark:text-neutral-200 font-medium">Contact number:</div>
              <div>{renderInlineField(9, { customWidth: 'w-[140px] sm:w-[160px]' })}</div>

              {/* Q10 */}
              <div className="text-neutral-800 dark:text-neutral-200 font-medium">Should take his:</div>
              <div>{renderInlineField(10, { suffixText: 'to the interview' })}</div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PART 2: Accommodation Feature Matching & Map (Q11–20)          */}
        {/* ------------------------------------------------------------- */}
        {isK5002 && partNum === 2 && (
          <div className="space-y-8">
            
            {/* Q11–14 Feature Matching */}
            <div className="space-y-4">
              <div className="text-[15px] leading-relaxed select-text">
                <strong className="block text-[16px] font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  Questions 11–14
                </strong>
                <p className="text-neutral-800 dark:text-neutral-200">
                  Which type of accommodation includes the following features?<br />
                  Write the correct letter, <strong className="font-bold text-black dark:text-white uppercase">A, B or C</strong>, next to questions 11–14.
                </p>
              </div>

              {/* Accommodation Box */}
              <div className="max-w-md bg-[#f9f9f9] dark:bg-zinc-800/80 p-4 border border-[#ddd] dark:border-zinc-700 rounded text-sm leading-relaxed">
                <div className="font-bold text-neutral-900 dark:text-neutral-100 mb-2">Types of accommodation</div>
                <div className="space-y-1 text-neutral-800 dark:text-neutral-200 font-mono text-sm">
                  <div><strong>A</strong> the flat</div>
                  <div><strong>B</strong> the house</div>
                  <div><strong>C</strong> the hostel</div>
                </div>
              </div>

              {/* Features List */}
              <div className="max-w-md space-y-2.5 pt-2">
                <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Features</div>
                
                <div className="flex items-center justify-between gap-4 p-2 rounded hover:bg-neutral-50 dark:hover:bg-zinc-800/50">
                  <span className="text-[15px] text-neutral-900 dark:text-neutral-100">a garden</span>
                  <div>{renderInlineField(11, { short: true })}</div>
                </div>

                <div className="flex items-center justify-between gap-4 p-2 rounded hover:bg-neutral-50 dark:hover:bg-zinc-800/50">
                  <span className="text-[15px] text-neutral-900 dark:text-neutral-100">a garage</span>
                  <div>{renderInlineField(12, { short: true })}</div>
                </div>

                <div className="flex items-center justify-between gap-4 p-2 rounded hover:bg-neutral-50 dark:hover:bg-zinc-800/50">
                  <span className="text-[15px] text-neutral-900 dark:text-neutral-100">an alarm system</span>
                  <div>{renderInlineField(13, { short: true })}</div>
                </div>

                <div className="flex items-center justify-between gap-4 p-2 rounded hover:bg-neutral-50 dark:hover:bg-zinc-800/50">
                  <span className="text-[15px] text-neutral-900 dark:text-neutral-100">new furniture</span>
                  <div>{renderInlineField(14, { short: true })}</div>
                </div>
              </div>
            </div>

            {/* Q15–20 Map Labeling */}
            <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-zinc-800">
              <div className="text-[15px] leading-relaxed select-text">
                <strong className="block text-[16px] font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  Questions 15–20
                </strong>
                <p className="text-neutral-800 dark:text-neutral-200">
                  Label the map below. Write the correct letter, <strong className="font-bold text-black dark:text-white uppercase">A–J</strong>, next to questions 15–20.
                </p>
              </div>

              {/* Side-by-side Map and Inputs */}
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
                
                {/* Inputs List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-4 p-2 rounded hover:bg-neutral-50 dark:hover:bg-zinc-800/50">
                    <span className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">the bank</span>
                    <div>{renderInlineField(15, { short: true })}</div>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-2 rounded hover:bg-neutral-50 dark:hover:bg-zinc-800/50">
                    <span className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">the house</span>
                    <div>{renderInlineField(16, { short: true })}</div>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-2 rounded hover:bg-neutral-50 dark:hover:bg-zinc-800/50">
                    <span className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">the hostel</span>
                    <div>{renderInlineField(17, { short: true })}</div>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-2 rounded hover:bg-neutral-50 dark:hover:bg-zinc-800/50">
                    <span className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">the flat</span>
                    <div>{renderInlineField(18, { short: true })}</div>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-2 rounded hover:bg-neutral-50 dark:hover:bg-zinc-800/50">
                    <span className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">the post office</span>
                    <div>{renderInlineField(19, { short: true })}</div>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-2 rounded hover:bg-neutral-50 dark:hover:bg-zinc-800/50">
                    <span className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">the bus stop</span>
                    <div>{renderInlineField(20, { short: true })}</div>
                  </div>
                </div>

                {/* Map Graphic */}
                <div className="relative group border border-neutral-300 dark:border-zinc-700 rounded-md overflow-hidden bg-neutral-100 dark:bg-zinc-800 p-2 text-center">
                  <img 
                    src="/uploads/map-k5002.png" 
                    alt="Map for questions 15-20" 
                    className="w-full h-auto max-h-[460px] object-contain mx-auto rounded"
                    onError={(e) => {
                      // Fallback if local image load issue
                      (e.target as HTMLImageElement).src = 'https://i.ibb.co/mVdn5m2F/image-2026-07-20-02-36-01.png'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setMapModalOpen(true)}
                    className="absolute top-4 right-4 bg-black/75 hover:bg-black text-white text-xs px-2.5 py-1.5 rounded flex items-center gap-1.5 cursor-pointer shadow-md transition-opacity"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Enlarge Map</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PART 3: Eyewitness Reliability & Matching Stages (Q21–30)     */}
        {/* ------------------------------------------------------------- */}
        {isK5002 && partNum === 3 && (
          <div className="space-y-8">
            
            {/* Q21–26 Multiple Choice Questions */}
            <div className="space-y-4">
              <div className="text-[15px] leading-relaxed select-text">
                <strong className="block text-[16px] font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  Questions 21–26
                </strong>
                <p className="text-neutral-800 dark:text-neutral-200">
                  Choose the correct letter, <strong className="font-bold text-black dark:text-white uppercase">A, B or C</strong>.
                </p>
              </div>

              <h2 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 pt-2 pb-1">
                Eyewitness reliability
              </h2>

              <div className="space-y-3">
                {renderMCQ(21, "Eleanor thinks eyewitnesses are believed when", [
                  { key: 'A', text: 'they are respected members of the community.' },
                  { key: 'B', text: 'they make their statements with confidence.' },
                  { key: 'C', text: 'they use sophisticated language in their accounts.' },
                ])}

                {renderMCQ(22, "What concerns Eleanor and Jamie about the texts they have read so far?", [
                  { key: 'A', text: 'No clear conclusions are reached.' },
                  { key: 'B', text: 'The studies involved comparatively few people.' },
                  { key: 'C', text: 'Some of the data were gathered some time ago.' },
                ])}

                {renderMCQ(23, "They agree that the most significant factor affecting eyewitness reliability is", [
                  { key: 'A', text: 'how good the lighting is.' },
                  { key: 'B', text: 'how long the event lasts.' },
                  { key: 'C', text: 'how far away the witness is.' },
                ])}

                {renderMCQ(24, "Jamie criticises photo-identifications, saying witnesses", [
                  { key: 'A', text: 'fail to compare the photos with their memory of the event.' },
                  { key: 'B', text: 'are not properly briefed about the procedure.' },
                  { key: 'C', text: 'become easily influenced by a figure of authority.' },
                ])}

                {renderMCQ(25, "They agree that the term 'naive observer' means a person who", [
                  { key: 'A', text: 'has no experience of a police investigation.' },
                  { key: 'B', text: 'did not realise they were witnessing a crime.' },
                  { key: 'C', text: 'was not present at the incident.' },
                ])}

                {renderMCQ(26, "They have learned that witnesses are reluctant to change their opinions because", [
                  { key: 'A', text: 'they do not want to appear foolish.' },
                  { key: 'B', text: 'they fear the legal consequences.' },
                  { key: 'C', text: 'they are keen for the case to be concluded.' },
                ])}
              </div>
            </div>

            {/* Q27–30 Matching child witness interview stages */}
            <div className="space-y-4 pt-6 border-t border-neutral-200 dark:border-zinc-800">
              <div className="text-[15px] leading-relaxed select-text">
                <strong className="block text-[16px] font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  Questions 27–30
                </strong>
                <p className="text-neutral-800 dark:text-neutral-200">
                  What problem may there be with child witnesses at each of the following stages of an interview?<br />
                  Choose <strong className="font-bold text-black dark:text-white uppercase">FOUR</strong> answers from the box (A–F) and write the correct letter.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">
                
                {/* Left: Stages */}
                <div className="space-y-3">
                  <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mb-2">
                    Interview stages
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200 dark:border-zinc-700">
                    <span className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">Rapport</span>
                    <div>{renderInlineField(27, { short: true })}</div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200 dark:border-zinc-700">
                    <span className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">Open-ended questions</span>
                    <div>{renderInlineField(28, { short: true })}</div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200 dark:border-zinc-700">
                    <span className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">Closed questions</span>
                    <div>{renderInlineField(29, { short: true })}</div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200 dark:border-zinc-700">
                    <span className="text-[15px] font-medium text-neutral-900 dark:text-neutral-100">Closure</span>
                    <div>{renderInlineField(30, { short: true })}</div>
                  </div>
                </div>

                {/* Right: Options Box */}
                <div className="bg-[#f9f9f9] dark:bg-zinc-800 p-4 rounded-md border border-neutral-300 dark:border-zinc-700 space-y-2 text-sm">
                  <div className="font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    Problems with child witnesses
                  </div>
                  <div className="space-y-1.5 text-neutral-800 dark:text-neutral-200 leading-snug">
                    <div><strong>A</strong> frightened by the unfamiliar environment</div>
                    <div><strong>B</strong> influenced by the interviewer</div>
                    <div><strong>C</strong> not understanding the difference between truth and lies</div>
                    <div><strong>D</strong> unwillingness to say they don't know</div>
                    <div><strong>E</strong> confused by the terminology</div>
                    <div><strong>F</strong> distrust of the interviewer</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PART 4: Plastics Exhibition (Q31–40) — EXACT MATCH TO IMAGE   */}
        {/* ------------------------------------------------------------- */}
        {isK5002 && partNum === 4 && (
          <div className="space-y-6">
            
            {/* Instruction block matching user's screenshot */}
            <div className="text-[15px] leading-relaxed select-text">
              <strong className="block text-[16px] font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                Questions 31–40
              </strong>
              <p className="text-neutral-800 dark:text-neutral-200">
                Complete the notes below. Write <br className="hidden sm:inline" />
                <strong className="font-bold text-black dark:text-white uppercase">ONE WORD ONLY</strong><br />
                for each answer.
              </p>
            </div>

            {/* Title */}
            <h2 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 pt-2">
              Plastics exhibition
            </h2>

            {/* Grid for Authentic Notes Alignment */}
            <div className="notes-grid grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-4 md:gap-x-6 gap-y-3.5 items-center text-[15px] leading-relaxed">
              
              {/* History Subheading */}
              <div className="font-bold text-[16px] text-neutral-900 dark:text-neutral-100 col-span-1 md:col-span-2 pt-2">
                History
              </div>

              {/* Bullet 1 (Context, no blank) */}
              <div className="col-span-1 md:col-span-2 flex items-baseline gap-2 text-neutral-800 dark:text-neutral-200">
                <span className="text-base select-none leading-none">•</span>
                <span>first plastic developed to replace ivory in sports equipment</span>
              </div>

              {/* Bullet 2 (Q31) */}
              <div className="flex items-baseline gap-2 text-neutral-800 dark:text-neutral-200">
                <span className="text-base select-none leading-none">•</span>
                <span>semi-synthetics, e.g. commercial celluloid–used</span>
              </div>
              <div>{renderInlineField(31, { suffixText: 'and acid' })}</div>

              {/* Bullet 3 (Q32) */}
              <div className="flex items-baseline gap-2 text-neutral-800 dark:text-neutral-200">
                <span className="text-base select-none leading-none">•</span>
                <span>experiments making plastics from</span>
              </div>
              <div>{renderInlineField(32, { suffixText: 'products were unsuccessful' })}</div>

              {/* Bullet 4 (Q33) */}
              <div className="flex items-baseline gap-2 text-neutral-800 dark:text-neutral-200">
                <span className="text-base select-none leading-none">•</span>
                <span>earliest fabric to be produced was artificial</span>
              </div>
              <div>{renderInlineField(33)}</div>

              {/* Bullet 5 (Context, no blank) */}
              <div className="col-span-1 md:col-span-2 flex items-baseline gap-2 text-neutral-800 dark:text-neutral-200 pt-1">
                <span className="text-base select-none leading-none">•</span>
                <span>Bakelite invented in 1907</span>
              </div>

              {/* Dash 1 (Q34) */}
              <div className="flex items-baseline gap-2 text-neutral-800 dark:text-neutral-200 pl-2">
                <span className="select-none leading-none">-</span>
                <span>first plastic produced in a</span>
              </div>
              <div>{renderInlineField(34)}</div>

              {/* Dash 2 (Q35) */}
              <div className="flex items-baseline gap-2 text-neutral-800 dark:text-neutral-200 pl-2">
                <span className="select-none leading-none">-</span>
                <span>invented by a</span>
              </div>
              <div>{renderInlineField(35, { suffixText: 'called Hendrik Baekeland' })}</div>

              {/* Dash 3 (Q36) */}
              <div className="flex items-baseline gap-2 text-neutral-800 dark:text-neutral-200 pl-2">
                <span className="select-none leading-none">-</span>
                <span>unusual because it becomes</span>
              </div>
              <div>{renderInlineField(36, { suffixText: 'when heated' })}</div>

              {/* Exhibition Subheading */}
              <div className="font-bold text-[16px] text-neutral-900 dark:text-neutral-100 col-span-1 md:col-span-2 pt-6 border-t border-neutral-200 dark:border-zinc-800">
                Exhibition
              </div>

              {/* Problems with display heading */}
              <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 col-span-1 md:col-span-2 pt-1">
                Problems with display:
              </div>

              {/* Bullet 6 (Q37) */}
              <div className="flex items-baseline gap-2 text-neutral-800 dark:text-neutral-200">
                <span className="text-base select-none leading-none">•</span>
                <span>older plastic objects may release acidic</span>
              </div>
              <div>{renderInlineField(37)}</div>

              {/* Bullet 7 (Q38) */}
              <div className="flex items-baseline gap-2 text-neutral-800 dark:text-neutral-200">
                <span className="text-base select-none leading-none">•</span>
                <span>plastic objects degrade in</span>
              </div>
              <div>{renderInlineField(38)}</div>

              {/* Popular exhibits heading */}
              <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 col-span-1 md:col-span-2 pt-3">
                Popular exhibits:
              </div>

              {/* Bullet 8 (Q39) */}
              <div className="flex items-baseline gap-2 text-neutral-800 dark:text-neutral-200">
                <span className="text-base select-none leading-none">•</span>
                <span>chandelier made using recycled</span>
              </div>
              <div>{renderInlineField(39)}</div>

              {/* Bullet 9 (Q40) */}
              <div className="flex items-baseline gap-2 text-neutral-800 dark:text-neutral-200">
                <span className="text-base select-none leading-none">•</span>
                <span>car made in Japan from semi-synthetic materials based on substances found in</span>
              </div>
              <div>{renderInlineField(40)}</div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* GENERIC & PASSAGE-BASED RENDERING FOR LISTENING TESTS          */}
        {/* ------------------------------------------------------------- */}
        {!isK5002 && (
          <div className="space-y-6">
            {hasEmbeddedQuestions ? (
              <div className="space-y-4">
                {section.instructions && (
                  <div className="p-3.5 sm:p-4 rounded-md bg-[#f2f2f2] dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700">
                    <p className="text-sm text-foreground/90 font-medium italic leading-relaxed">
                      {section.instructions}
                    </p>
                  </div>
                )}
                {renderPassageWithQuestions(passageHtml)}
              </div>
            ) : (
              section.groups.map(group => {
                const groupPassageHtml = group.passage?.content || ''
                const groupHasEmbedded = Boolean(
                  groupPassageHtml &&
                  group.questions.some(q => {
                    const reg = new RegExp(`\\[${q.question_number}\\]|id=["']q?${q.question_number}["']|data-question=["']${q.question_number}["']`, 'i')
                    return reg.test(groupPassageHtml)
                  })
                )

                if (groupHasEmbedded) {
                  return (
                    <div key={group.id} className="space-y-4">
                      {(group.title || group.instruction) && (
                        <div className="p-4 rounded-md bg-[#f2f2f2] dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700">
                          {group.title && <h3 className="font-bold text-base text-foreground mb-1">{group.title}</h3>}
                          {group.instruction && <p className="text-sm text-muted-foreground italic leading-relaxed whitespace-pre-line">{group.instruction}</p>}
                        </div>
                      )}
                      {renderPassageWithQuestions(groupPassageHtml)}
                    </div>
                  )
                }

                // Find matching pool options if any question in this group has options
                const hasMatchingQuestions = group.questions.some(q => q.question_type === 'matching' || q.question_type === 'matching_features')
                const poolOptions = group.questions.find(q => q.options && q.options.length > 0)?.options || []

                // Check if all or most questions are completion
                const isAllCompletion = group.questions.every(q => 
                  q.question_type === 'note_completion' || 
                  q.question_type === 'sentence_completion' || 
                  q.question_type === 'summary_completion' ||
                  q.question_type === 'flow_chart_completion'
                )

                return (
                  <div key={group.id} className="space-y-4">
                    {(group.title || group.instruction) && (
                      <div className="p-4 rounded-md bg-[#f2f2f2] dark:bg-zinc-800/60 border border-neutral-200 dark:border-zinc-700">
                        {group.title && <h3 className="font-bold text-base text-foreground mb-1">{group.title}</h3>}
                        {group.instruction && <p className="text-sm text-muted-foreground italic leading-relaxed whitespace-pre-line">{group.instruction}</p>}
                      </div>
                    )}

                    {/* Matching Option Box */}
                    {hasMatchingQuestions && poolOptions.length > 0 && (
                      <div className="bg-[#f9f9f9] dark:bg-zinc-800/90 p-4 border border-neutral-300 dark:border-zinc-700 rounded-lg text-sm leading-relaxed">
                        <div className="font-bold text-foreground mb-2 flex items-center gap-2">
                          <span>Options Reference:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {poolOptions.map(opt => (
                            <div key={opt.option_key} className="flex items-start gap-2">
                              <span className="font-bold text-primary font-mono shrink-0">{opt.option_key}</span>
                              <span className="text-foreground">{opt.option_text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Questions Container */}
                    <div className={cn(
                      isAllCompletion 
                        ? "p-5 sm:p-7 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 divide-y divide-neutral-100 dark:divide-zinc-800/80 space-y-3"
                        : "space-y-4"
                    )}>
                      {group.questions.map(q => {
                        // 1. Multiple Response / Checkboxes (e.g. Choose TWO letters)
                        if (q.question_type === 'multiple_select' || (q.question_type as any) === 'multiple_response') {
                          const currentAnswers: string[] = Array.isArray(session.answers[q.id])
                            ? session.answers[q.id]
                            : typeof session.answers[q.id] === 'string' && session.answers[q.id]
                            ? session.answers[q.id].split(',').map((s: string) => s.trim().toUpperCase())
                            : []

                          const toggleAns = (key: string) => {
                            if (session.isSubmitted) return
                            const next = currentAnswers.includes(key)
                              ? currentAnswers.filter(a => a !== key)
                              : [...currentAnswers, key]
                            session.handleAnswerChange(q.id, next)
                          }

                          return (
                            <div key={q.id} className="p-4 rounded-xl border border-neutral-200 dark:border-zinc-700 bg-neutral-50/70 dark:bg-zinc-800/40 space-y-2.5">
                              <div className="flex items-center gap-2.5">
                                <span 
                                  onClick={() => session.handleToggleMark(q.id)}
                                  className="inline-flex items-center justify-center min-w-[28px] h-[26px] border-[1.5px] font-bold text-xs shrink-0 px-1 rounded-xs bg-neutral-100 dark:bg-neutral-800 cursor-pointer select-none"
                                >
                                  {q.question_number}
                                </span>
                                <span className="font-semibold text-foreground text-[15px]">{q.question_text}</span>
                              </div>
                              <div className="space-y-1.5 pl-9">
                                {q.options?.map(opt => {
                                  const isChecked = currentAnswers.includes(opt.option_key.toUpperCase())
                                  return (
                                    <label key={opt.option_key} className="flex items-center gap-3 p-2 rounded hover:bg-neutral-100 dark:hover:bg-zinc-700/60 cursor-pointer text-sm select-text">
                                      <input 
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={session.isSubmitted}
                                        onChange={() => toggleAns(opt.option_key.toUpperCase())}
                                        className="accent-[#005eb8] w-4 h-4 cursor-pointer"
                                      />
                                      <span className="font-bold text-foreground">{opt.option_key}</span>
                                      <span className="text-foreground">{opt.option_text}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        }

                        // 2. Matching Question with Options Pool
                        if ((q.question_type === 'matching' || q.question_type === 'matching_features') && (q.options?.length || poolOptions.length > 0)) {
                          const opts = q.options && q.options.length > 0 ? q.options : poolOptions
                          const userVal = session.answers[q.id] || ''

                          return (
                            <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200 dark:border-zinc-700 hover:border-neutral-300">
                              <div className="flex items-center gap-2.5">
                                <span 
                                  onClick={() => session.handleToggleMark(q.id)}
                                  title="Click to flag question"
                                  className={cn(
                                    "inline-flex items-center justify-center min-w-[28px] h-[26px] border-[1.5px] font-bold text-xs shrink-0 px-1 rounded-xs select-none cursor-pointer",
                                    session.markedQuestions.has(q.id) 
                                      ? "border-amber-500 bg-amber-400 text-black" 
                                      : "border-neutral-800 dark:border-neutral-300 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                                  )}
                                >
                                  {q.question_number}
                                </span>
                                <span className="font-medium text-foreground select-text">{q.question_text}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={userVal}
                                  disabled={session.isSubmitted}
                                  onChange={(e) => session.handleAnswerChange(q.id, e.target.value.toUpperCase())}
                                  className="border rounded px-2.5 py-1 text-sm bg-white dark:bg-zinc-900 border-neutral-300 dark:border-zinc-600 font-bold text-foreground cursor-pointer focus:border-[#005eb8] focus:ring-1 focus:ring-[#005eb8]"
                                >
                                  <option value="">Select option...</option>
                                  {opts.map(opt => (
                                    <option key={opt.option_key} value={opt.option_key}>
                                      {opt.option_key} — {opt.option_text.length > 40 ? opt.option_text.substring(0, 40) + '...' : opt.option_text}
                                    </option>
                                  ))}
                                </select>
                                <div>{renderInlineField(q.question_number, { short: true, hideBadge: true })}</div>
                              </div>
                            </div>
                          )
                        }

                        // 3. Multiple Choice with 2-4 radio options
                        if (q.question_type === 'multiple_choice' && q.options && q.options.length > 0) {
                          return (
                            <div key={q.id}>
                              {renderMCQ(
                                q.question_number, 
                                q.question_text, 
                                q.options.map(o => ({ key: o.option_key, text: o.option_text }))
                              )}
                            </div>
                          )
                        }

                        // 4. Flow-chart step or Completion with inline blank
                        const hasInlineBlank = /\[____+\]|\[\s*\]|_{2,}|\[\d+\]/.test(q.question_text || '')
                        if (hasInlineBlank) {
                          const parts = q.question_text.split(/\[____+\]|\[\s*\]|_{2,}|\[\d+\]/)
                          const bulletParts = parts[0].split(' • ')

                          return (
                            <div 
                              key={q.id} 
                              className={cn(
                                isAllCompletion
                                  ? "pt-2.5 pb-1 flex flex-wrap items-baseline gap-2 text-[15px] leading-relaxed text-foreground select-text"
                                  : "flex flex-wrap items-baseline gap-2 text-[15px] p-2.5 rounded bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200 dark:border-zinc-700"
                              )}
                            >
                              {bulletParts.length > 1 ? (
                                <>
                                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{bulletParts[0]}</span>
                                  <span className="text-neutral-400">•</span>
                                  <span>{bulletParts.slice(1).join(' • ')}</span>
                                </>
                              ) : (
                                <span>{parts[0]}</span>
                              )}
                              {renderInlineField(q.question_number)}
                              {parts[1] && <span>{parts[1]}</span>}
                            </div>
                          )
                        }

                        // 5. Default Completion Item
                        return (
                          <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 text-[15px] p-2.5 rounded bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200 dark:border-zinc-700">
                            <span className="font-medium text-foreground">{q.question_text}</span>
                            <div>{renderInlineField(q.question_number)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

      </div>

      {/* Script Modal (Transcript with Clues) */}
      <Dialog open={scriptModalOpen} onOpenChange={setScriptModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-primary">
              <FileText className="w-5 h-5 text-primary" />
              <span>{(section as any).title || SCRIPTS_K5002[partNum]?.title || `Part ${partNum} Listening Script`}</span>
            </DialogTitle>
          </DialogHeader>
          <div 
            className="flex-1 overflow-y-auto pr-2 space-y-3 text-sm text-foreground leading-relaxed custom-scrollbar py-2"
            dangerouslySetInnerHTML={{
              __html: (section as any).passage_html || (section as any).instructions || SCRIPTS_K5002[partNum]?.html || `<p class="text-muted-foreground italic">No transcript script available for this section.</p>`
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Map Zoom Modal */}
      <Dialog open={mapModalOpen} onOpenChange={setMapModalOpen}>
        <DialogContent className="max-w-4xl p-2">
          <DialogHeader className="p-3">
            <DialogTitle className="text-sm font-semibold">Map for Questions 15–20</DialogTitle>
          </DialogHeader>
          <div className="p-2 flex items-center justify-center bg-black/5 rounded">
            <img 
              src="/uploads/map-k5002.png" 
              alt="Map enlarged" 
              className="max-h-[80vh] w-auto object-contain rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://i.ibb.co/mVdn5m2F/image-2026-07-20-02-36-01.png'
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
