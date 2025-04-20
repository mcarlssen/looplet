## 1. Toy Analogy and User Goals

- **Toy setup**  
  A large fixed ring with teeth, a smaller gear that rolls around (inside or outside), and a pen inserted at some offset in the small gear.

- **User controls**  
  - **Fixed‑ring radius** (R)  
  - **Rolling‑gear radius** (r)  
  - **Pen‑offset distance** (d)  
  - **Roll type**: *hypotrochoid* (inside) or *epitrochoid* (outside)  
  - **Start‑angle offset** (φ)  
  - **Styling**: stroke color, width, dash pattern  
  - **Layering**: multiple parameter sets stacked  

---

## 2. Mathematical Foundations

### 2.1 Hypotrochoid (gear rolls **inside** fixed ring)

\[
\begin{cases}
x(\theta) = (R - r)\cos\theta + d\,\cos\!\bigl(\tfrac{R - r}{r}\,\theta\bigr)\\
y(\theta) = (R - r)\sin\theta - d\,\sin\!\bigl(\tfrac{R - r}{r}\,\theta\bigr)
\end{cases}
\]

### 2.2 Epitrochoid (gear rolls **outside** fixed ring)

\[
\begin{cases}
x(\theta) = (R + r)\cos\theta - d\,\cos\!\bigl(\tfrac{R + r}{r}\,\theta\bigr)\\
y(\theta) = (R + r)\sin\theta - d\,\sin\!\bigl(\tfrac{R + r}{r}\,\theta\bigr)
\end{cases}
\]

- **Closure condition**  
  The curve closes when \(R/r\) is rational.  
  ```js
  // JavaScript example for closure:
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const rotations = r && R ? (r / gcd(R, r)) : 1;
  const θmax = 2 * Math.PI * rotations;
