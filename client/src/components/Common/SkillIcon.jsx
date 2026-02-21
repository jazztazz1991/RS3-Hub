import React from 'react';

// Dynamically import all skill icons from the assets folder
// This relies on Vite's import.meta.glob feature
const skillIcons = import.meta.glob('../../assets/skills/*.png', { eager: true, import: 'default' });

const SkillIcon = ({ skillName, className, style }) => {
    if (!skillName) return null;

    // Ensure the skill name matches the file naming convention (e.g., "Herblore", "Attack")
    // Wiki filenames are generally Capitalized.
    // Some might have spaces, but our downloader replaced spaces with underscores or similar if any.
    // The downloader used: re.sub(r'[^\w\-_\. ]', '_', skill_name) and capitalized.
    // Let's assume standard capitalization for now.
    
    // Helper to format name: "herblore" -> "Herblore"
    const formattedName = skillName.charAt(0).toUpperCase() + skillName.slice(1).toLowerCase();
    
    // Construct the path key used in the glob object
    // Note: The path must match exactly what is in the glob keys.
    const iconPath = `../../assets/skills/${formattedName}.png`;
    
    const iconSrc = skillIcons[iconPath];

    if (!iconSrc) {
        console.warn(`Icon for skill "${skillName}" not found at ${iconPath}`);
        return <span className={className}>{skillName.charAt(0)}</span>;
    }

    return (
        <img 
            src={iconSrc} 
            alt={`${skillName} icon`} 
            className={className} 
            style={style}
            title={skillName}
        />
    );
};

export default SkillIcon;
