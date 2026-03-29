import numpy as np  # type: ignore
import random
import logging
from typing import List, Dict, Any

class MockGANService:
    """
    Mock GAN service for question diversity enhancement
    In a production environment, this would be replaced with an actual GAN model
    """
    
    def __init__(self):
        self.question_templates = {
            'technical': {
                'programming': [
                    "Implement a {algorithm} in {language} and explain its time complexity.",
                    "How would you optimize a {problem_type} problem in {language}?",
                    "Design a {data_structure} that supports {operations}.",
                    "Explain the trade-offs between {concept1} and {concept2} in {context}."
                ],
                'system_design': [
                    "Design a {system_type} that can handle {scale} users.",
                    "How would you implement {feature} in a distributed {system}?",
                    "What are the challenges of building a {service_type} and how would you address them?",
                    "Explain how you would scale a {application_type} from {start_scale} to {end_scale}."
                ],
                'algorithms': [
                    "Solve the {problem_name} problem using {approach}.",
                    "Given {input_type}, find the {output_type} in optimal time.",
                    "Implement {algorithm_type} for {use_case}.",
                    "Optimize this {problem_category} problem for {constraint}."
                ]
            },
            'non-technical': {
                'behavioral': [
                    "Tell me about a time when you {situation} and how you handled it.",
                    "Describe a situation where you had to {challenge} and what was the outcome.",
                    "Give me an example of when you {action} and what you learned from it.",
                    "How did you handle a time when you {conflict_situation}?"
                ],
                'situational': [
                    "If you were {scenario}, how would you approach it?",
                    "What would you do if {challenging_situation} occurred?",
                    "How would you handle {workplace_scenario}?",
                    "If faced with {decision_scenario}, what factors would you consider?"
                ],
                'leadership': [
                    "Describe your experience with {leadership_activity}.",
                    "How do you {leadership_skill} in a team environment?",
                    "What's your approach to {management_challenge}?",
                    "How would you {leadership_scenario} with your team?"
                ]
            }
        }
        
        self.variable_pools = {
            'algorithm': ['binary search', 'quicksort', 'merge sort', 'dijkstra', 'BFS', 'DFS'],
            'language': ['Python', 'Java', 'JavaScript', 'C++', 'Go'],
            'problem_type': ['search', 'sorting', 'graph traversal', 'dynamic programming'],
            'data_structure': ['hash table', 'binary tree', 'graph', 'trie', 'heap'],
            'operations': ['insertion, deletion, and search', 'range queries', 'updates and queries'],
            'concept1': ['arrays', 'linked lists', 'recursion', 'iteration'],
            'concept2': ['hash tables', 'trees', 'dynamic programming', 'greedy algorithms'],
            'context': ['memory usage', 'performance', 'scalability', 'maintainability'],
            'system_type': ['chat application', 'video streaming service', 'e-commerce platform', 'social media platform'],
            'scale': ['1 million', '10 million', '100 million', '1 billion'],
            'feature': ['real-time notifications', 'user authentication', 'data analytics', 'content recommendation'],
            'system': ['system', 'microservices architecture', 'cloud environment'],
            'service_type': ['payment processing system', 'search engine', 'recommendation engine'],
            'application_type': ['web application', 'mobile app', 'API service'],
            'start_scale': ['1000 users', '10K users', '100K users'],
            'end_scale': ['1M users', '10M users', '100M users'],
            'situation': ['faced a difficult deadline', 'disagreed with your manager', 'had to learn a new technology quickly'],
            'challenge': ['work with a difficult team member', 'resolve a complex problem', 'adapt to sudden changes'],
            'action': ['took initiative on a project', 'mentored a colleague', 'improved a process'],
            'conflict_situation': ['your idea was rejected', 'you made a mistake', 'priorities changed suddenly'],
            'scenario': ['leading a project with tight deadlines', 'managing conflicting priorities', 'working with limited resources'],
            'challenging_situation': ['a team member was underperforming', 'you disagreed with a major decision', 'a project was failing'],
            'workplace_scenario': ['communication breakdown in your team', 'resistance to change', 'conflicting stakeholder requirements'],
            'decision_scenario': ['choosing between two equally important projects', 'allocating limited budget', 'hiring decisions'],
            'leadership_activity': ['leading a cross-functional team', 'managing remote workers', 'driving organizational change'],
            'leadership_skill': ['motivate team members', 'delegate effectively', 'provide feedback'],
            'management_challenge': ['performance management', 'conflict resolution', 'strategic planning'],
            'leadership_scenario': ['build consensus', 'manage underperformance', 'drive innovation']
        }
    
    def generate_diverse_questions(self, base_questions: List[Dict[str, Any]], diversity_factor: float = 0.3) -> List[Dict[str, Any]]:
        """
        Generate diverse variations of base questions using GAN-like approach
        diversity_factor: 0.0 (no diversity) to 1.0 (maximum diversity)
        """
        try:
            diverse_questions = []
            
            for question_data in base_questions:
                # Apply GAN-like transformations based on diversity factor
                if random.random() < diversity_factor:
                    # Generate a completely new question using templates
                    new_question = self._generate_from_template(
                        question_data['type'], 
                        question_data.get('category', 'general'),
                        question_data['difficulty']
                    )
                    if new_question:
                        diverse_questions.append(new_question)
                    else:
                        diverse_questions.append(question_data)
                else:
                    # Apply minor variations to existing question
                    varied_question = self._apply_variation(question_data)
                    diverse_questions.append(varied_question)
            
            return diverse_questions
            
        except Exception as e:
            logging.error(f"Error in GAN service: {e}")
            return base_questions
    
    def _generate_from_template(self, question_type: str, category: str, difficulty: str) -> Dict[str, Any]:
        """Generate a new question from templates"""
        try:
            if question_type not in self.question_templates:
                return {}
            
            if category not in self.question_templates[question_type]:
                category = random.choice(list(self.question_templates[question_type].keys()))
            
            template = random.choice(self.question_templates[question_type][category])
            
            # Fill in template variables
            question_text = self._fill_template(template)
            
            return {
                'question': question_text,
                'type': question_type,
                'difficulty': difficulty,
                'category': category,
                'generated_by_gan': True
            }
            
        except Exception as e:
            logging.error(f"Error generating from template: {e}")
            return {}
    
    def _fill_template(self, template: str) -> str:
        """Fill template with random variables"""
        import re
        
        # Find all variables in template (format: {variable_name})
        variables = re.findall(r'\{(\w+)\}', template)
        
        filled_template = template
        for var in variables:
            if var in self.variable_pools:
                replacement = random.choice(self.variable_pools[var])
                filled_template = filled_template.replace(f'{{{var}}}', replacement)
        
        return filled_template
    
    def _apply_variation(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply minor variations to existing questions"""
        question_text = question_data['question']
        
        # Simple variations: add context, change phrasing slightly
        variations = [
            f"Can you {question_text.lower()}",
            f"Please explain how you would {question_text.lower()}",
            f"In your experience, {question_text.lower()}",
            f"From a practical standpoint, {question_text.lower()}"
        ]
        
        # 30% chance to apply variation
        if random.random() < 0.3:
            question_data = question_data.copy()
            question_data['question'] = random.choice(variations)
            question_data['varied_by_gan'] = True
        
        return question_data
    
    def calculate_diversity_score(self, questions: List[Dict[str, Any]]) -> float:
        """Calculate how diverse the question set is"""
        if not questions:
            return 0.0
        
        # Simple diversity calculation based on:
        # 1. Category distribution
        # 2. Question length variation
        # 3. Keyword diversity
        
        categories = [q.get('category', 'unknown') for q in questions]
        category_diversity = len(set(categories)) / len(categories) if categories else 0
        
        lengths = [len(q['question'].split()) for q in questions]
        length_variance = np.var(lengths) / np.mean(lengths) if lengths else 0
        length_diversity = min(length_variance, 1.0)  # Cap at 1.0
        
        # Overall diversity score
        diversity_score = (category_diversity + length_diversity) / 2
        
        return min(diversity_score, 1.0)
    
    def enhance_question_quality(self, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Use GAN-like techniques to enhance question quality"""
        enhanced_questions = []
        
        for question_data in questions:
            enhanced = question_data.copy()
            
            # Add complexity scoring
            complexity_score = self._calculate_complexity(question_data['question'])
            enhanced['complexity_score'] = complexity_score
            
            # Add semantic tags
            semantic_tags = self._extract_semantic_tags(question_data['question'], question_data['type'])
            enhanced['semantic_tags'] = semantic_tags
            
            enhanced_questions.append(enhanced)
        
        return enhanced_questions
    
    def _calculate_complexity(self, question: str) -> float:
        """Calculate question complexity score"""
        # Simple complexity metrics
        word_count = len(question.split())
        unique_words = len(set(question.lower().split()))
        avg_word_length = np.mean([len(word) for word in question.split()])
        
        # Normalize and combine metrics
        complexity = (
            min(word_count / 50, 1.0) * 0.4 +  # Word count factor
            min(unique_words / word_count, 1.0) * 0.3 +  # Vocabulary diversity
            min(avg_word_length / 10, 1.0) * 0.3  # Word complexity
        )
        
        return complexity
    
    def _extract_semantic_tags(self, question: str, question_type: str) -> List[str]:
        """Extract semantic tags from question"""
        tags = []
        
        # Technical keywords
        technical_keywords = {
            'algorithm', 'data structure', 'complexity', 'optimization', 'database',
            'system design', 'architecture', 'scaling', 'performance', 'security'
        }
        
        # Behavioral keywords
        behavioral_keywords = {
            'experience', 'challenge', 'conflict', 'leadership', 'teamwork',
            'problem solving', 'communication', 'time management', 'decision making'
        }
        
        question_lower = question.lower()
        
        if question_type == 'technical':
            for keyword in technical_keywords:
                if keyword in question_lower:
                    tags.append(keyword)
        else:
            for keyword in behavioral_keywords:
                if keyword in question_lower:
                    tags.append(keyword)
        
        return tags
