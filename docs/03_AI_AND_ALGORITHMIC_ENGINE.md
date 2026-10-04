# 🧠 FocusIQ — AI & Algorithmic Engine Deep Dive

**Author:** Kartik Garg, AI Product Manager  
**Module Codebase:** `/backend/scheduler.py` & `/backend/sentiment.py`  
**Status:** Validated in Production  

---

## 1. Algorithmic Philosophy: Why Deterministic AI + NLP?

In productivity tools, **user trust is binary**. If an algorithm recommends studying a minor elective for 4 hours while a student's high-stakes Data Structures exam is tomorrow morning, the student loses trust and uninstalls the app.

Many modern products default to Large Language Model (LLM) wrappers (e.g., OpenAI GPT-4 API) for scheduling. FocusIQ deliberately rejected this approach for three architectural reasons:

| Evaluation Dimension | Generative LLM Wrapper (GPT-4) | FocusIQ Deterministic Engine + VADER NLP |
|:---|:---|:---|
| **Latency** | 2,500ms – 5,000ms per request | **< 15ms** (Compiled Python execution) |
| **Operational Cost** | $0.01 – $0.03 per schedule generation | **$0.00** (Zero external API dependencies) |
| **Reliability & Hallucinations** | Prone to stochastic output and math errors | **100% Deterministic & Mathematically Sound** |
| **Offline Execution** | Fails without high-bandwidth internet | Fully functional offline / local runtime |

FocusIQ uses **AI where it counts**:
1. **Mathematical Optimization:** For deterministic scheduling and constraint-based time allocation.
2. **Cognitive Science:** SuperMemo-2 (SM-2) for memory retention curves.
3. **Lexicon-Based NLP:** VADER sentiment analysis for extracting emotional struggle from unstructured study notes.

---

## 2. Visual AI & Algorithmic Architecture

![FocusIQ Algorithmic Architecture](./images/ai_engine_workflow.jpg)

---

## 3. The Multi-Factor Priority Scoring Engine

Every subject registered in a student's curriculum is evaluated dynamically against a 4-factor scoring model:

$$\text{Priority Score } (P) = (N \times 0.4) + (U \times 0.3) + (S \times 0.2) + (D \times 0.1)$$

Where:
* $N$ = Neglect Penalty (Normalized 0 – 10+)
* $U$ = Exam Urgency (Normalized 0 – 10)
* $S$ = Historical Focus Struggle (Normalized 0 – 10)
* $D$ = Base Subject Difficulty (Normalized 0 – 10)

```
                       ┌───────────────────────────────┐
                       │   Days Since Last Studied     │ ──[ 40% Weight ]──┐
                       └───────────────────────────────┘                   │
                       ┌───────────────────────────────┐                   │
                       │     Days Until Next Exam      │ ──[ 30% Weight ]──┼──▶ [ Composite Priority Score ]
                       └───────────────────────────────┘                   │    (Higher = Studied First)
                       ┌───────────────────────────────┐                   │
                       │ Low Focus / Struggle History  │ ──[ 20% Weight ]──┤
                       └───────────────────────────────┘                   │
                       ┌───────────────────────────────┐                   │
                       │   Self-Reported Difficulty    │ ──[ 10% Weight ]──┘
                       └───────────────────────────────┘
```

---

### 3.1. Mathematical Formulations

#### 1. Neglect Penalty ($N$ — 40% Weight)
The system calculates elapsed days since the subject was last studied:
$$N = \Delta t_{\text{days}} = \frac{T_{\text{now}} - T_{\text{last\_studied}}}{86,400\text{ seconds}}$$
* **Cold Start Handling:** If a subject has never been studied ($T_{\text{last\_studied}} = \text{null}$), $N$ defaults to $7.0$ days to prioritize initial subject coverage.
* **Impact:** A course neglected for 10 days generates $10 \times 0.4 = 4.0$ base priority points.

#### 2. Exam Urgency ($U$ — 30% Weight)
Proximity to the target exam date is scaled on an inverted urgency gradient:
$$U = \begin{cases} 
10.0, & \text{if } \Delta t_{\text{exam}} \le 0 \text{ (Due today or overdue)} \\
\max(0.0, 10.0 - (\Delta t_{\text{exam}} \times 0.5)), & \text{if } \Delta t_{\text{exam}} > 0 \\
0.0, & \text{if } T_{\text{exam\_date}} = \text{null} 
\end{cases}$$
* **Thresholds:**
  * Exam in 2 days: $10 - (2 \times 0.5) = 9.0 \times 0.3 = 2.7$ points.
  * Exam in 14 days: $10 - (14 \times 0.5) = 3.0 \times 0.3 = 0.9$ points.
  * Exam in 20+ days: Urgency drops to $0.0$.

#### 3. Low Focus Struggle Indicator ($S$ — 20% Weight)
Inverse of the running average focus score ($\text{avg\_focus} \in [1.0, 5.0]$):
$$S = \max\left(0.0, \frac{5.0 - \text{avg\_focus}}{5.0}\right) \times 10.0$$
* A student struggling with an average focus rating of $1.5/5.0$ yields $S = ((5 - 1.5)/5) \times 10 = 7.0 \times 0.2 = 1.4$ points.
* A student mastering a subject with $4.8/5.0$ yields $S = ((5 - 4.8)/5) \times 10 = 0.4 \times 0.2 = 0.08$ points.

#### 4. Base Subject Difficulty ($D$ — 10% Weight)
User-defined difficulty from the 1–5 onboarding rating:
$$D = \left(\frac{\text{difficulty}}{5.0}\right) \times 10.0$$
* Difficulty 5/5 provides $10.0 \times 0.1 = 1.0$ point.
* Difficulty 1/5 provides $2.0 \times 0.1 = 0.2$ points.

---

### 3.2. Human-Readable Reason Synthesis

Students demand clarity on *why* a subject was selected. FocusIQ passes scored subjects through a rule-based natural language generator:

```python
def build_reason(subject, priority: float) -> str:
    elapsed = days_since(subject.last_studied)
    if subject.last_studied is None:
        return "Never studied yet"
    elif elapsed >= 3:
        return f"Not studied for {int(elapsed)} days"

    due_days = days_until(subject.exam_date)
    if due_days is not None and 0 <= due_days <= 7:
        d = math.ceil(due_days)
        return f"Exam in {d} day{'s' if d != 1 else ''}"

    if subject.avg_focus and subject.avg_focus < 3:
        return "Low focus history"

    if subject.struggling:
        return "Marked as struggling"

    return "Scheduled for today"
```

---

## 4. Proportional Time Allocation & Budgeting Solver

Once subjects are ranked descending by priority, FocusIQ allocates the student's daily available study time ($T_{\text{daily}}$) across subjects.

### Algorithm Rules:
1. **Total Available Minutes:** $M_{\text{total}} = T_{\text{daily}} \times 60$ (e.g., $4.0\text{ hours} = 240\text{ minutes}$).
2. **Proportional Share:** For subject $i$, compute its relative share:
   $$\text{Raw Minutes}_i = \left(\frac{P_i}{\sum_{k=1}^N P_k}\right) \times M_{\text{total}}$$
3. **Boundary Clamping & Quantization:**
   * **Minimum Session:** 20 minutes (prevents superficial context switching).
   * **Maximum Session:** 90 minutes (aligns with ultradian cognitive focus rhythms).
   * **Quantization:** Rounded to the nearest 5-minute block:
   $$M_i = \min\left(90, \max\left(20, \text{round}\left(\frac{\text{Raw Minutes}_i}{5}\right) \times 5\right)\right)$$

---

## 5. SuperMemo-2 (SM-2) Spaced Repetition Engine

Spaced repetition models the **Ebbinghaus Forgetting Curve**, exponentially increasing the review interval when recall is successful and resetting it when recall fails.

```
Retention %
100% ────┐           ┌─────┐           ┌───────┐
         │ \         │     │ \         │       │ \
  50% ───┼──\────────┼─────┼──\────────┼───────┼──\──────────
         │   \       │     │   \       │       │   \
   0% ───┴────┴──────┴─────┴────┴──────┴───────┴────┴────────
         Day 1      Day 2      Day 6       Day 15+    Time
         Review 1   Review 2   Review 3    Review 4
```

### 5.1. Quality Score Mapping ($q$)
The user's 1–5 focus rating submitted during session logging is mapped to the standard SM-2 quality scale ($q \in [0, 5]$):
$$q = \text{round}\left(\frac{\text{focus\_rating} - 1}{4} \times 5\right)$$

| User Focus Rating | SM-2 Quality ($q$) | Interpretation |
|:---|:---|:---|
| **5 (Laser Focused)** | 5 | Perfect recall; optimal retention |
| **4 (Good Focus)** | 4 | Correct response after hesitation |
| **3 (Moderate Focus)**| 3 | Serious difficulty; marginal recall |
| **2 (Distracted)** | 1 | Incorrect recall; familiar in retrospect |
| **1 (Brain Fog / Failed)** | 0 | Complete blackout; total failure |

---

### 5.2. Easiness Factor ($EF$) & Interval ($I$) Recalibration

The Easiness Factor determines how aggressively review intervals expand:
$$EF' = \max\left(1.3, EF + 0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02)\right)$$

#### Interval Calculation:
$$I(n) = \begin{cases}
1 \text{ day}, & \text{if } q < 3 \text{ (Failure: reset repetitions to 0)} \\
1 \text{ day}, & \text{if } q \ge 3 \text{ and } n = 0 \\
6 \text{ days}, & \text{if } q \ge 3 \text{ and } n = 1 \\
\text{round}(I_{n-1} \times EF'), & \text{if } q \ge 3 \text{ and } n \ge 2
\end{cases}$$

Next review timestamp:
$$T_{\text{next\_review}} = T_{\text{now}} + I(n) \text{ days}$$

When $T_{\text{now}} \ge T_{\text{next\_review}}$, the subject is flagged as `isDueRevision = True`, adding the `🔄 Review Due` badge to the UI.

---

## 6. VADER NLP Sentiment & Struggle Extraction

When students study, they often leave informal notes:
* *"Understood binary search trees easily, loved the traversal examples."*
* *"Totally lost on Dijkstra's algorithm. Confused about priority queue implementation."*

Rather than requiring high-friction diagnostic quizzes, FocusIQ uses **passive sentiment mining**.

### 6.1. Polarity Analysis
FocusIQ uses the **VADER (Valence Aware Dictionary and sEntiment Reasoner)** lexicon (`vaderSentiment`):
* Calculates valence scores across punctuation, capitalization, and semantic lexicons.
* Produces a normalized compound score $\in [-1.0, +1.0]$.
  * $\ge +0.05 \implies$ **Positive**
  * $\le -0.05 \implies$ **Negative**
  * Between $-0.05$ and $+0.05 \implies$ **Neutral**

### 6.2. Domain-Specific Struggle Lexicon
In addition to general sentiment, notes are scanned against a specialized 20-keyword academic struggle lexicon:

```python
STRUGGLE_KEYWORDS = [
    "confused", "stuck", "hard", "difficult", "lost", "struggling",
    "cant understand", "can't understand", "don't get", "no idea",
    "tough", "overwhelmed", "behind", "failed", "forget", "forgot",
    "unclear", "complex", "weird", "not getting", "dont get",
]
```

### 6.3. Closed-Loop Feedback
If compound sentiment is negative OR any struggle keyword is detected:
1. `session.sentiment` is recorded as `"negative"`.
2. `subject.struggling` is toggled to `True`.
3. In subsequent scheduling cycles, the subject is tagged with `"Marked as struggling"`, increasing its priority and scheduling a re-review within 24–48 hours regardless of prior ease factors.

---

## 7. Smart Alerts & Proactive Reminders

The engine continuously scans all registered coursework for proactive risk factors:

```python
# scheduler.py reminder thresholds
if elapsed >= 3:
    severity = "high" if elapsed >= 7 else "medium"
    reminders.append({
        "type": "neglected",
        "subject": s.name,
        "message": f"{s.name} not studied in {int(elapsed)} days",
        "severity": severity,
    })

if s.exam_date and 0 <= due <= 7:
    reminders.append({
        "type": "exam",
        "subject": s.name,
        "message": f"{s.name} exam in {math.ceil(due)} days!",
        "severity": "high" if due <= 2 else "medium",
    })
```

---

## 8. Phase 2 Machine Learning Roadmap: Collaborative Filtering

For Phase 2, FocusIQ will introduce **Peer Cohort Benchmarking** using cosine similarity over student behavioral vectors:

$$\text{Similarity}(u_A, u_B) = \frac{\mathbf{v}_A \cdot \mathbf{v}_B}{\|\mathbf{v}_A\| \|\mathbf{v}_B\|}$$

Where $\mathbf{v}$ represents subject difficulty ratings, weekly study patterns, and retention velocities. 

* **Product Deliverable:** *"Students with your profile who also struggled with DBMS retained concepts 35% better when breaking study into 45-minute morning sessions."*
