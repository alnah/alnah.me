---
title: "Why is it hard to build learner scenarios based on the CEFR?"
date: 2026-04-16
draft: false
description: "Why CEFR-based learner scenarios are hard to design in practice, and how Pi helped me as a teacher to reduce the cost of pedagogical planning."
category: teaching
tags:
  - cefr
  - curriculum
  - scenario
  - pedagogy
  - agent
  - llm
  - pi
---

# Why is it hard to build learner scenarios based on the CEFR?

> I want to teach with [CEFR](https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4) descriptors in a pragmatic way. The problem is that everyday teaching conditions push me toward less contextualized formats.

From my experience in one-to-one teaching on [italki](https://www.italki.com/teacher/8123606) and in language schools, teachers like me are expected to individualize learning. We do not have enough time or the right tools to design CEFR-aligned scenarios based on learners’ contexts and needs.

Small schools tend to rely on textbooks because the curriculum is outsourced to foreign language publishers. This allows the person responsible for pedagogy in those schools to focus on teacher management and mid-term assessments.

Only solid pedagogical infrastructure can make this happen. In French teaching, [the Eurocentres and Eaquals recommendations for building scenarios](https://www.eaquals.org/wp-content/uploads/Inventaire_ONLINE_full.pdf) provide a strong framework. Unfortunately, for many of us, it is almost impossible to apply under our working conditions. Students pay the price.

## Teachers are motivated and lack design capacity.

> If I want to support my student’s progression, I will use a textbook and build language knowledge without enough practice. If I want to build confidence, I have to use conversation and sacrifice a more solid progression.

My daily life is one-to-one teaching. I have to teach around ~30 students in parallel. This means I prepare lessons under time pressure. I adapt my materials on the fly. I use the [Common European Framework of Reference for Languages: Learning, Teaching, Assessment (CEFR)](https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4) in general terms. In daily work it is very hard to use operational descriptors to build my teaching materials. It is too heavy.

This has two consequences for individual teaching:

- I can build structured lessons. They can feel too rigid and school-like. The sequence is very clear, if not boring. To do that, I need to rely on a textbook for progression. Of course, this is often too far from my students’ context, even if it is efficient for planning.

- I can also offer flexible conversation classes. However, speaking does not cover everything involved in language learning. People should also be able to read, write, interact, and mediate meaning across texts, people, and contexts if they want to feel progression.

Individual teaching tends to lose either the learner’s context or the learner’s long-term sociolinguistic development, sometimes both. The CEFR is not meant to be a grammar checklist. It describes what a person can do at each level in reception, production, interaction, and mediation. It also describes levels of mastery in pragmatic, linguistic, and sociolinguistic competences. It helps teachers assess and support their students.

## Schools centralize curriculum design and lose learners’ contexts.

> If a school wants coherence around a strong curriculum, it usually has to organize students by level rather than by context or group identity. This can support reception and progression in language knowledge, but it can also reduce production, interaction, and mediation.

From my experience, and from what I know from other language teachers, schools often solve this problem relying on a senior teacher working as a pedagogical coordinator. This person is responsible for designing programs for A1, A2, B1, and so on. They teach less, or they have stopped to teach. They focus on structure and consistency for students. They also manage teachers. They meet with the head of the school. They work on controlled assessments. The curriculum is put at the background to priorize other responsibilities.

Unfortunately, this also creates two limitations:

- Scenario-based curricula can be well designed. But they are designed for a language level, not for a group of people with particular contexts. In other words, the curriculum does not always connect with what constitutes the identity of a group.

- Classes are well organized because learners are treated as members of a group, not as individuals. This leads to a lack of communicative goals tailored to each student. Good schools invest a lot of time in building relationships with students to not lose them.

The group format also changes the balance of CEFR activities. Reception activities such as listening and reading tend to dominate. Knowledge of the target language can become stronger. However, students often develop less in production, interaction, and mediation. This is because group teaching comes with structural limitations.

## What are the consequences for learners?

> Anxious learners may prefer a school curriculum or a teacher with a textbook. More pragmatic learners may prefer conversation. In both cases, they often end up losing either confidence or progression.

Let’s take a 90-minute class with 6 students. I think this is reasonable. 5 minutes are gone for welcoming and warming up the students. 20 minutes are used for teacher explanations, instructions, clarifications, and the whole-class framing. Add 5 more minutes for closing the class. That leaves only 60 useful minutes for students.

This is more or less 10 minutes for each student. This is still theoretical speaking time. In a class, students do not participate equally. Dead time still exists. Some dominant speakers are often overvalued by less experienced teachers. There is always some friction during activities. A more realistic range is maybe 6 to 8 minutes per learner.

This is why learners often get only a few minutes of speaking and meaningful interaction. Mediation is rarely practiced in depth. Individual feedback is weaker. Learners’ progression is often measured through mid-term assessments and controlled exercises based mainly on reception and written production.

These are clearly not the best outcomes for learners:

- Anxious learners compensate with structured knowledge. They like learning vocabulary and grammar rules, and they often lack confidence when they need to speak. They will likely go to a school to access a structured curriculum based on their level. But they may still not speak enough to build confidence.

- Pragmatic learners enjoy interaction and production. They often turn to a private tutor or teacher. It sounds like a good idea at first. They may meet someone who focuses on structure through a textbook. This strengthens reception and language knowledge. Or that person may rely on conversation and weaken long-term progression.

## So what can teachers and schools do?

> If I want to design scenario-based curricula for my students, or for a group of learners in a school, I need better tools and systems to support that work. That is the only way to reduce friction and build better materials.

I think we should review our expectations and understand these trade-offs better if we want to create good solutions. We cannot expect our students to buy textbooks, follow a solid curriculum in a school, and then compensate for their weaknesses with a private teacher. This costs a lot of money and takes a lot of time. We should focus on building better support for our students.

Designing strong scenarios requires a lot of invisible work. When I do that, I need to understand the learner’s context. Then I must select the relevant CEFR descriptors and make hard choices about the competences required by the student’s profile. I need to map those descriptors and turn them into activities. I also need to sequence the scenario in balanced phases. This is heavy work.

Good schools and good teachers care about this, and they already know these things. I have often felt frustrated when I had to accept these trade-offs for my students. It affects my responsibility as a teacher, and it is frankly not enjoyable to face these limits every day in your job. But we still lack solutions that help us balance these trade-offs.

## Trying to solve part of the problem with an open source agent.

> I think this can help teachers and schools understand agentic workflows better, and see how they can be applied to language teaching.

I think we can improve language teaching by building tools and systems that help both teachers and schools. This would also benefit students. I built a set of tooling extensions for [Pi](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent), an open-source coding agent environment made by [Mario Zechner](https://mariozechner.at/). Through those extensions, my agent can access CEFR descriptors and additional descriptor sets that I curated or created to support language-teaching workflows. This gives the agent a richer pedagogical context and a structured retrieval layer.

The agent can retrieve CEFR and French descriptors, compare them across levels, and help me organize them more systematically. It also has access to a headless Chrome browser and can search for websites, images, and other online materials. It can then draft a scenario based on the context I choose to share. With a good set of instructions, it can support a long design session autonomously. Last time, my agent worked ~2h on such a scenario draft.

It allows comparative and reusable reasoning about descriptors. The agent can help me connect them and suggest teaching-material designs. It can also help me evaluate an authentic document by comparing it with relevant descriptors for that kind of text. By chatting or speaking with the agent, I can focus more on architecting programs and scenarios. It helps me refine details and align them with my students’ needs.

I feel very enthusiastic about teaching French using my custom tooling. The different phases of a scenario are now easier to build. It used to take me weeks to find authentic documents on the web, evaluate them with CEFR descriptors, and adapt them to a target level. When I started teaching, it took me a year and a half, alongside my lessons, to do that from A1 to C1 with the help of many textbooks. Now I can do it much faster. My students really enjoy the scenarios.

This can be reliable under certain conditions. Behind the agent, there is a Large Language Model (LLM). On its own, a model is not enough to guarantee good pedagogical output. The system is useful due to the combination of curated descriptors, constrained retrieval, comparison across domains and subdomains such as production, reception, mediation, and interaction, and teacher validation.

I will soon share how I designed this agent.
