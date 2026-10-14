import Image from "next/image";
import { PortfolioIcon, type PortfolioIconName } from "@/components/portfolio-icon";

const technologies: Record<string, { logo?: string; icon?: PortfolioIconName; kind: string }> = {
  Python: { logo: "python", kind: "Programming language" },
  JavaScript: { logo: "javascript", kind: "Programming language" },
  "C++": { logo: "cplusplus", kind: "Programming language" },
  SQL: { icon: "database", kind: "Query language" },
  "React.js": { logo: "react", kind: "Web interfaces" },
  "React Native": { logo: "react", kind: "Mobile interfaces" },
  "Node.js": { logo: "nodejs", kind: "JavaScript runtime" },
  "Express.js": { logo: "express", kind: "Backend framework" },
  FastAPI: { logo: "fastapi", kind: "Python API framework" },
  "REST APIs": { icon: "api", kind: "Service interfaces" },
  "Scikit-learn": { logo: "scikitlearn", kind: "Machine learning" },
  TensorFlow: { logo: "tensorflow", kind: "Machine learning" },
  Pandas: { logo: "pandas", kind: "Data analysis" },
  NumPy: { logo: "numpy", kind: "Numerical computing" },
  NLP: { icon: "code", kind: "Language processing" },
  "LLM Integration": { icon: "spark", kind: "AI integrations" },
  PostgreSQL: { logo: "postgresql", kind: "Relational database" },
  MongoDB: { logo: "mongodb", kind: "Document database" },
  Firebase: { logo: "firebase", kind: "Backend platform" },
  AWS: { logo: "amazonwebservices", kind: "Cloud infrastructure" },
  Docker: { logo: "docker", kind: "Containers" },
  Git: { logo: "git", kind: "Version control" },
  Postman: { logo: "postman", kind: "API development" },
  Razorpay: { logo: "razorpay", kind: "Payment integrations" },
};

export function TechnologyList({ items }: { items: readonly string[] }) {
  return <ul className="technology-list">{items.map(name => {
    const technology = technologies[name];
    return <li key={name} className="technology-entry"><span className="technology-logo" aria-hidden="true">{technology?.logo ? <Image src={`/tech-icons/${technology.logo}.svg`} alt="" width={32} height={32} /> : <PortfolioIcon name={technology?.icon ?? "tools"} />}</span><div><strong>{name}</strong><span>{technology?.kind ?? "Development tool"}</span></div></li>;
  })}</ul>;
}
