/**
 * Analytics Dashboard Charts and Visualizations
 * Uses Chart.js for data visualization
 */

/**
 * Initialize all analytics charts
 */
function initializeAnalyticsCharts(analyticsData, faceAnalysisData) {
    initializePerformanceChart(analyticsData);
    initializeFaceAnalysisChart(faceAnalysisData);
}

/**
 * Performance Breakdown Radar Chart
 */
function initializePerformanceChart(data) {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    new Chart(ctx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: [
                'Overall Performance',
                'Technical Skills',
                'Communication',
                'Confidence',
                'Eye Contact',
                'Facial Expression'
            ],
            datasets: [{
                label: 'Your Performance',
                data: [
                    data.overall * 100,
                    data.technical * 100,
                    data.communication * 100,
                    data.confidence * 100,
                    data.eyeContact * 100,
                    data.facialExpression * 100
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

/**
 * Face Analysis Timeline Chart
 */
function initializeFaceAnalysisChart(faceData) {
    const ctx = document.getElementById('faceAnalysisChart');
    if (!ctx || !faceData || faceData.length === 0) return;
    
    // Prepare timeline data
    const timestamps = faceData.map(d => formatTimestamp(d.timestamp));
    const confidenceData = faceData.map(d => d.confidence * 100);
    const happinessData = faceData.map(d => d.happiness * 100);
    const concentrationData = faceData.map(d => d.concentration * 100);
    const nervousnessData = faceData.map(d => d.nervousness * 100);
    
    new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [
                {
                    label: 'Confidence',
                    data: confidenceData,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Happiness',
                    data: happinessData,
                    borderColor: 'rgb(255, 205, 86)',
                    backgroundColor: 'rgba(255, 205, 86, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Concentration',
                    data: concentrationData,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Nervousness',
                    data: nervousnessData,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

/**
 * Performance History Chart for Profile Page
 */
function initializePerformanceHistoryChart(performanceData, elementId = 'performanceHistoryChart') {
    const ctx = document.getElementById(elementId);
    if (!ctx || !performanceData || performanceData.length === 0) return;
    
    // Calculate moving average
    const movingAverage = calculateMovingAverage(performanceData, 3);
    
    new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: performanceData.map((_, index) => `Interview ${index + 1}`),
            datasets: [
                {
                    label: 'Performance Score',
                    data: performanceData.map(score => score * 100),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Trend',
                    data: movingAverage.map(score => score * 100),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0.4,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

/**
 * Skills Comparison Chart
 */
function initializeSkillsComparisonChart(skillsData, elementId = 'skillsComparisonChart') {
    const ctx = document.getElementById(elementId);
    if (!ctx || !skillsData) return;
    
    new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Technical Skills', 'Communication', 'Confidence', 'Presentation'],
            datasets: [{
                data: [
                    skillsData.technical * 100,
                    skillsData.communication * 100,
                    skillsData.confidence * 100,
                    skillsData.presentation * 100
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                ],
                borderColor: [
                    'rgb(54, 162, 235)',
                    'rgb(75, 192, 192)',
                    'rgb(255, 205, 86)',
                    'rgb(255, 99, 132)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + Math.round(context.parsed) + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Progress Over Time Chart
 */
function initializeProgressChart(progressData, elementId = 'progressChart') {
    const ctx = document.getElementById(elementId);
    if (!ctx || !progressData) return;
    
    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: progressData.labels,
            datasets: [{
                label: 'Average Score',
                data: progressData.scores,
                backgroundColor: function(context) {
                    const value = context.parsed.y;
                    if (value >= 80) return 'rgba(40, 167, 69, 0.8)';
                    if (value >= 60) return 'rgba(255, 193, 7, 0.8)';
                    return 'rgba(220, 53, 69, 0.8)';
                },
                borderColor: function(context) {
                    const value = context.parsed.y;
                    if (value >= 80) return 'rgb(40, 167, 69)';
                    if (value >= 60) return 'rgb(255, 193, 7)';
                    return 'rgb(220, 53, 69)';
                },
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

/**
 * Utility Functions
 */

function formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function calculateMovingAverage(data, windowSize) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const end = i + 1;
        const window = data.slice(start, end);
        const average = window.reduce((sum, val) => sum + val, 0) / window.length;
        result.push(average);
    }
    return result;
}

function getPerformanceColor(score) {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'danger';
}

function getPerformanceLabel(score) {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Needs Improvement';
}

// Export functions for global use
window.AnalyticsCharts = {
    initializeAnalyticsCharts,
    initializePerformanceChart,
    initializeFaceAnalysisChart,
    initializePerformanceHistoryChart,
    initializeSkillsComparisonChart,
    initializeProgressChart,
    formatTimestamp,
    calculateMovingAverage,
    getPerformanceColor,
    getPerformanceLabel
};
